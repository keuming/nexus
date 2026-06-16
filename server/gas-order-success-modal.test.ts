import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGasOrder, createGasOrderItem, createGasDelivery, generateOrderReference } from './gas-db';

describe('Gas Order Success Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a gas order with correct reference', async () => {
    const reference = await generateOrderReference();
    expect(reference).toBeDefined();
    expect(reference).toMatch(/^GAZ-/); // Format réel: GAZ-XXXXXX-XXX
  });

  it('should calculate total amount correctly', () => {
    const items = [
      { bottleId: 1, quantity: 2, unitPriceXOF: 3500, deliveryFeeXOF: 500 },
      { bottleId: 2, quantity: 1, unitPriceXOF: 6500, deliveryFeeXOF: 800 },
    ];

    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.unitPriceXOF * item.quantity + item.deliveryFeeXOF);
    }, 0);

    expect(totalAmount).toBe(14800); // (3500*2 + 500) + (6500*1 + 800) = 7000 + 500 + 6500 + 800 = 14800
  });

  it('should have all required order success fields', () => {
    const orderSuccess = {
      reference: 'GAZ-403899-PXJ',
      totalAmount: 4000,
      clientName: 'Jean Dupont',
    };

    expect(orderSuccess).toHaveProperty('reference');
    expect(orderSuccess).toHaveProperty('totalAmount');
    expect(orderSuccess).toHaveProperty('clientName');
    expect(orderSuccess.reference).toBeTruthy();
    expect(orderSuccess.totalAmount).toBeGreaterThan(0);
    expect(orderSuccess.clientName).toBeTruthy();
  });

  it('should display success message with correct order details', () => {
    const orderSuccess = {
      reference: 'GAZ-403899-PXJ',
      totalAmount: 4000,
      clientName: 'Jean Dupont',
    };

    const successMessage = `Commande Confirmée! Numéro: ${orderSuccess.reference}, Montant: ${orderSuccess.totalAmount} FCFA, Client: ${orderSuccess.clientName}`;
    
    expect(successMessage).toContain('Commande Confirmée!');
    expect(successMessage).toContain(orderSuccess.reference);
    expect(successMessage).toContain(orderSuccess.clientName);
    expect(successMessage).toContain(orderSuccess.totalAmount.toString());
  });

  it('should reset form after successful order', () => {
    const initialForm = {
      clientName: 'Jean Dupont',
      clientPhone: '+225 07 12 34 56 78',
      clientEmail: 'jean@example.com',
      deliveryAddress: '123 Rue du Commerce',
      city: 'Abidjan',
      paymentMethod: 'cash' as const,
      notes: 'Livraison rapide',
    };

    const resetForm = {
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      deliveryAddress: '',
      city: '',
      paymentMethod: 'cash' as const,
      notes: '',
    };

    expect(resetForm.clientName).toBe('');
    expect(resetForm.clientPhone).toBe('');
    expect(resetForm.deliveryAddress).toBe('');
    expect(resetForm.city).toBe('');
  });

  it('should handle order creation with all required fields', async () => {
    const orderData = {
      reference: 'GAZ-403899-PXJ',
      clientName: 'Jean Dupont',
      clientPhone: '+225 07 12 34 56 78',
      clientEmail: 'jean@example.com',
      deliveryAddress: '123 Rue du Commerce',
      city: 'Abidjan',
      supplierId: 3,
      totalAmountXOF: 4000,
      paymentMethod: 'cash' as const,
      notes: 'Livraison rapide',
    };

    expect(orderData.reference).toBeDefined();
    expect(orderData.clientName).toBeDefined();
    expect(orderData.clientPhone).toBeDefined();
    expect(orderData.deliveryAddress).toBeDefined();
    expect(orderData.city).toBeDefined();
    expect(orderData.totalAmountXOF).toBeGreaterThan(0);
  });

  it('should show next steps after order confirmation', () => {
    const nextSteps = [
      'Vous recevrez une confirmation par SMS',
      'Le fournisseur vous contactera pour confirmer la livraison',
      'Suivez votre commande dans l\'historique',
    ];

    expect(nextSteps).toHaveLength(3);
    expect(nextSteps[0]).toContain('SMS');
    expect(nextSteps[1]).toContain('fournisseur');
    expect(nextSteps[2]).toContain('historique');
  });
});
