import { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flame, Truck, MapPin, Phone, Mail, Plus, Minus, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  bottleId: number;
  type: string;
  capacity: string;
  quantity: number;
  unitPriceXOF: number;
  deliveryFeeXOF: number;
}

interface OrderSuccess {
  reference: string;
  totalAmount: number;
  clientName: string;
}

export function GasOrder() {
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("suppliers");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccess | null>(null);
  const [addedBottles, setAddedBottles] = useState<Set<number>>(new Set());
  const [orderForm, setOrderForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    deliveryAddress: "",
    city: "",
    paymentMethod: "cash" as const,
    notes: "",
  });

  // Fetch suppliers
  const { data: suppliers, isLoading: suppliersLoading } = trpc.gas.suppliers.getByCompanyId.useQuery(1);

  // Fetch bottles for selected supplier
  const { data: bottles, isLoading: bottlesLoading } = trpc.gas.bottles.getAvailable.useQuery(supplierId || 0, {
    enabled: !!supplierId,
  });

  // Create order mutation
  const createOrderMutation = trpc.gas.orders.create.useMutation({
    onSuccess: (data) => {
      console.log('Order created successfully:', data);
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.unitPriceXOF + item.deliveryFeeXOF) * item.quantity, 0);
      console.log('Setting order success with:', { reference: data.reference, totalAmount, clientName: orderForm.clientName });
      setOrderSuccess({
        reference: data.reference,
        totalAmount: totalAmount,
        clientName: orderForm.clientName,
      });
      toast.success(`Commande créée: ${data.reference}`);
      setCartItems([]);
      setOrderForm({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        deliveryAddress: "",
        city: "",
        paymentMethod: "cash",
        notes: "",
      });
      setSupplierId(null);
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Calculate totals
  const { subtotal, totalDeliveryFee, total } = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.unitPriceXOF * item.quantity, 0);
    const totalDeliveryFee = cartItems.reduce((sum, item) => sum + item.deliveryFeeXOF * item.quantity, 0);
    return {
      subtotal,
      totalDeliveryFee,
      total: subtotal + totalDeliveryFee,
    };
  }, [cartItems]);

  const addToCart = useCallback((bottle: any) => {
    console.log('addToCart called with bottle:', bottle);
    try {
      setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.bottleId === bottle.id);
        if (existingItem) {
          console.log('Item exists, updating quantity');
          return prevItems.map((item) =>
            item.bottleId === bottle.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          console.log('New item, adding to cart');
          return [
            ...prevItems,
            {
              bottleId: bottle.id,
              type: bottle.type,
              capacity: bottle.capacity,
              quantity: 1,
              unitPriceXOF: parseFloat(bottle.priceXOF),
              deliveryFeeXOF: parseFloat(bottle.deliveryFeeXOF),
            },
          ];
        }
      });
      
      // Marquer la bouteille comme ajoutée
      setAddedBottles((prev) => {
        const newSet = new Set(prev);
        newSet.add(bottle.id);
        return newSet;
      });
      
      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setAddedBottles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(bottle.id);
          return newSet;
        });
      }, 2000);
      
      toast.success(`${bottle.type} ajouté au panier`);
    } catch (error) {
      console.error('Error in addToCart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    }
  }, []);

  const updateQuantity = (bottleId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bottleId);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.bottleId === bottleId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (bottleId: number) => {
    setCartItems(cartItems.filter((item) => item.bottleId !== bottleId));
  };

  const handleSubmitOrder = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('handleSubmitOrder called');
    console.log('supplierId:', supplierId);
    console.log('cartItems.length:', cartItems.length);
    console.log('orderForm:', orderForm);
    
    if (!supplierId || cartItems.length === 0) {
      console.log('Validation failed: supplierId or cartItems');
      toast.error("Veuillez sélectionner un fournisseur et ajouter des articles");
      return;
    }

    if (!orderForm.clientName || !orderForm.clientPhone || !orderForm.deliveryAddress || !orderForm.city) {
      console.log('Validation failed: orderForm fields');
      console.log('clientName:', orderForm.clientName);
      console.log('clientPhone:', orderForm.clientPhone);
      console.log('deliveryAddress:', orderForm.deliveryAddress);
      console.log('city:', orderForm.city);
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      console.log('Submitting order...');
      const result = await createOrderMutation.mutateAsync({
        clientName: orderForm.clientName,
        clientPhone: orderForm.clientPhone,
        clientEmail: orderForm.clientEmail || undefined,
        deliveryAddress: orderForm.deliveryAddress,
        city: orderForm.city,
        supplierId,
        items: cartItems.map((item) => ({
          bottleId: item.bottleId,
          quantity: item.quantity,
          unitPriceXOF: item.unitPriceXOF,
          deliveryFeeXOF: item.deliveryFeeXOF,
        })),
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes || undefined,
      });
      console.log('Order submitted successfully:', result);
      
      // Afficher le modal de succès
      const articleName = cartItems.map(item => item.type).join(', ');
      setOrderSuccess({
        reference: result.reference,
        clientName: orderForm.clientName,
        totalAmount: total,
      });
      
      // Réinitialiser le formulaire et le panier
      setCartItems([]);
      setAddedBottles(new Set());
      setOrderForm({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        deliveryAddress: '',
        city: '',
        paymentMethod: 'cash',
        notes: '',
      });
      setSupplierId(null);
      setActiveTab('suppliers');
      
      toast.success('Commande créée avec succès!');
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Erreur lors de la création de la commande');
    }
  }, [supplierId, cartItems, orderForm, createOrderMutation, total]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flame className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Commande de Gaz</h1>
          </div>
          <p className="text-gray-600">Livraison rapide et fiable de bouteilles de gaz</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="suppliers">Fournisseurs & Produits</TabsTrigger>
            <TabsTrigger value="checkout">Panier & Livraison</TabsTrigger>
          </TabsList>

          {/* Tab 1: Suppliers & Products */}
          <TabsContent value="suppliers" className="space-y-6">
            {/* Suppliers Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  Sélectionnez un Fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suppliersLoading ? (
                  <div className="text-center py-8 text-gray-500">Chargement des fournisseurs...</div>
                ) : suppliers && suppliers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suppliers.map((supplier: any) => (
                      <div
                        key={supplier.id}
                        onClick={() => {
                          console.log('Setting supplier ID:', supplier.id);
                          setSupplierId(supplier.id);
                        }}
                        className={`cursor-pointer transition-all rounded-lg border ${
                          supplierId === supplier.id
                            ? "ring-2 ring-orange-600 bg-orange-50 border-orange-600"
                            : "hover:shadow-lg border-gray-200"
                        }`}
                      >
                        <Card className="border-0">
                          <CardContent className="pt-6">
                            <h3 className="font-bold text-lg mb-2">{supplier.businessName}</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {supplier.phone}
                              </div>
                              {supplier.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {supplier.email}
                                </div>
                              )}
                              {supplier.address && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {supplier.address}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Aucun fournisseur disponible</div>
                )}
              </CardContent>
            </Card>

            {/* Products Grid */}
            {supplierId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-600" />
                    Produits Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bottlesLoading ? (
                    <div className="text-center py-8 text-gray-500">Chargement des produits...</div>
                  ) : bottles && bottles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bottles.map((bottle: any) => (
                        <div key={bottle.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-lg">{bottle.type}</h3>
                              <p className="text-sm text-gray-600">{bottle.capacity}</p>
                            </div>
                            {bottle.stock > 0 && (
                              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
                                En stock
                              </span>
                            )}
                          </div>

                          <div className="space-y-3 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">Prix unitaire</p>
                              <p className="text-2xl font-bold text-orange-600">
                                {parseFloat(bottle.priceXOF).toLocaleString()} FCFA
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Truck className="w-4 h-4" />
                              Livraison: {parseFloat(bottle.deliveryFeeXOF).toLocaleString()} FCFA
                            </div>
                          </div>

                          {bottle.description && (
                            <p className="text-sm text-gray-600 mb-4">{bottle.description}</p>
                          )}

                          <button
                            onClick={() => addToCart(bottle)}
                            disabled={bottle.stock <= 0 || addedBottles.has(bottle.id)}
                            className={`w-full font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-all duration-300 ${
                              addedBottles.has(bottle.id)
                                ? 'bg-green-600 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                            } disabled:bg-gray-400`}
                            type="button"
                          >
                            {addedBottles.has(bottle.id) ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Ajouté au Panier ✓
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                Ajouter au Panier
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">Aucun produit disponible</div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Checkout */}
          <TabsContent value="checkout" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Votre Panier</CardTitle>
                    <CardDescription>{cartItems.length} article(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {cartItems.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Flame className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Votre panier est vide</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.bottleId} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <h3 className="font-bold">{item.type}</h3>
                              <p className="text-sm text-gray-600">{item.capacity}</p>
                              <p className="text-sm text-orange-600 font-bold">
                                {(item.unitPriceXOF * item.quantity).toLocaleString()} FCFA
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.bottleId, item.quantity - 1)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-bold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.bottleId, item.quantity + 1)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeFromCart(item.bottleId)}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Form */}
                {cartItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations de Livraison</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="clientName">Nom du Client *</Label>
                        <Input
                          id="clientName"
                          value={orderForm.clientName}
                          onChange={(e) => setOrderForm({ ...orderForm, clientName: e.target.value })}
                          placeholder="Jean Dupont"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientPhone">Téléphone *</Label>
                        <Input
                          id="clientPhone"
                          value={orderForm.clientPhone}
                          onChange={(e) => setOrderForm({ ...orderForm, clientPhone: e.target.value })}
                          placeholder="+225 07 12 34 56 78"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          value={orderForm.clientEmail}
                          onChange={(e) => setOrderForm({ ...orderForm, clientEmail: e.target.value })}
                          placeholder="jean@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deliveryAddress">Adresse de Livraison *</Label>
                        <Input
                          id="deliveryAddress"
                          value={orderForm.deliveryAddress}
                          onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })}
                          placeholder="123 Rue du Commerce"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Ville *</Label>
                        <Input
                          id="city"
                          value={orderForm.city}
                          onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                          placeholder="Abidjan"
                        />
                      </div>
                      <div>
                        <Label htmlFor="paymentMethod">Méthode de Paiement *</Label>
                        <Select value={orderForm.paymentMethod} onValueChange={(value: any) => setOrderForm({ ...orderForm, paymentMethod: value })}>
                          <SelectTrigger id="paymentMethod">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Espèces</SelectItem>
                            <SelectItem value="card">Carte Bancaire</SelectItem>
                            <SelectItem value="transfer">Virement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes Spéciales</Label>
                        <Textarea
                          id="notes"
                          value={orderForm.notes}
                          onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                          placeholder="Toute information supplémentaire..."
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle>Résumé de la Commande</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sous-total:</span>
                        <span>{subtotal.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Frais de Livraison:</span>
                        <span>{totalDeliveryFee.toLocaleString()} FCFA</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-orange-600">{total.toLocaleString()} FCFA</span>
                      </div>
                    </div>

                    {cartItems.length > 0 && (
                      <Button
                        type="button"
                        onClick={handleSubmitOrder}
                        disabled={createOrderMutation.isPending}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                      >
                        {createOrderMutation.isPending ? "Traitement..." : "Confirmer la Commande"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Success Modal */}
      <Dialog open={!!orderSuccess} onOpenChange={(open) => !open && setOrderSuccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-green-600">✓ Commande Confirmée!</DialogTitle>
          </DialogHeader>
          {orderSuccess && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 rounded-lg p-4 space-y-3 border-l-4 border-green-600">
                <p className="text-base text-gray-800 leading-relaxed">
                  <span className="font-bold text-green-700">Client {orderSuccess.clientName}</span>,<br />
                  votre commande de <span className="font-bold text-orange-600">{cartItems.map(item => item.type).join(', ')}</span> a été enregistrée avec succès.
                </p>
                <p className="text-sm text-gray-700 italic mt-2">
                  Le livreur vous contactera bientôt. Gardez l'écoute!
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 border-t-2 border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro de Commande:</span>
                  <span className="font-bold text-orange-600">{orderSuccess.reference}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600 font-semibold">Montant Total:</span>
                  <span className="font-bold text-lg text-orange-600">{orderSuccess.totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Prochaines etapes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Vous recevrez une confirmation par SMS</li>
                    <li>Le fournisseur vous contactera pour confirmer la livraison</li>
                    <li>Suivez votre commande dans l historique</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setOrderSuccess(null);
                    setActiveTab("suppliers");
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Nouvelle Commande
                </Button>
                <Button
                  onClick={() => setOrderSuccess(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
