import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './Style';
import { searchApi } from './apiService';
import { goBack, openChat } from './navigation';

function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

export default function BillDetailScreen({ route }) {
  const { bill: routeBill, id: routeId } = route?.params || {};
  const billId = routeId || routeBill?.id;

  const seed = routeBill && typeof routeBill === 'object' ? routeBill : null;

  const [bill, setBill] = useState(seed);
  const [status, setStatus] = useState(safeString(seed?.status, 'AWAITING PAYMENT'));
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadBill = useCallback(async () => {
    if (seed) {
      setBill((prev) => prev || seed);
      if (seed.status) setStatus(seed.status);
    }

    if (!billId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchApi.getBillDetail(billId);
      const payload = data?.bill || data?.data || data;
      if (payload && typeof payload === 'object') {
        setBill((prev) => ({ ...(prev || {}), ...payload }));
        if (payload.status) setStatus(payload.status);
      }
    } catch (_) {
      // keep seed
    } finally {
      setIsLoading(false);
    }
  }, [billId, seed]);

  useEffect(() => {
    loadBill();
  }, [loadBill]);

  const statusUpper = (status || '').toUpperCase();
  const isPaid = statusUpper.includes('PAID');
  const canPay = !isPaid;

  const handlePayBill = async () => {
    if (!canPay) return;

    setStatus('PAID');
    setBill((prev) => (prev ? { ...prev, status: 'PAID' } : prev));

    setIsProcessing(true);
    try {
      if (billId) {
        await searchApi.payBill(billId);
      }
      Alert.alert('Success', 'Payment processed successfully!');
    } catch (err) {
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusPillColor = () => {
    const s = statusUpper;
    if (s.includes('PAID')) return { bg: '#E8F5E9', text: '#2E7D32' };
    if (s.includes('OVERDUE')) return { bg: '#FFEBEE', text: '#C62828' };
    if (s.includes('YOU OWE') || s.includes('OFFER') || s.includes('PENDING'))
      return { bg: '#FFF3E0', text: '#E65100' };
    return { bg: '#E3F2FD', text: '#007AFF' };
  };

  const getAmountDirectionLabel = () => {
    if (statusUpper.includes('YOU OWE') || statusUpper.includes('I OWE'))
      return 'You owe';
    if (statusUpper.includes('PAID')) return 'Paid';
    return 'Owed to you';
  };

  const display = bill || seed || {};
  const chat = display.chat || {};
  const lineItems = Array.isArray(display.lineItems) ? display.lineItems : [];
  const timeline = Array.isArray(display.timeline) ? display.timeline : [];
  const amountDisplay =
    display.amountLabel ||
    (display.amount != null ? `$${display.amount}` : display.total || '—');

  if (isLoading && !display.title && !display.amountLabel && !seed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
            <Text style={styles.backButtonText}>Search</Text>
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Bill</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Search</Text>
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Bill</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
        {/* Source Chat */}
        <TouchableOpacity
          style={styles.sourceChatCard}
          onPress={() => openChat({ id: chat.id, chat })}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.avatarCircleSmall,
              {
                backgroundColor: chat.avatarColor || '#007AFF',
                marginRight: 10,
              },
            ]}
          >
            <Text style={styles.avatarTextSmall}>
              {safeString(
                chat.avatarInitials,
                safeString(chat.title, 'C').substring(0, 2).toUpperCase()
              )}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceChatTitle}>
              {safeString(chat.title, 'Chat')}
            </Text>
            <Text style={styles.sourceChatSub}>
              {safeString(chat.contextLabel, 'Group · open chat')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Amount Hero */}
        <View style={styles.amountHeroContainer}>
          <Text style={{ fontSize: 12, color: '#8E8E93', fontWeight: '600' }}>
            {getAmountDirectionLabel()}
          </Text>
          <Text style={styles.heroAmountText}>{amountDisplay}</Text>
          {!!status && (
            <View
              style={[
                styles.statusBadgeSmall,
                { backgroundColor: getStatusPillColor().bg },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeTextSmall,
                  { color: getStatusPillColor().text },
                ]}
              >
                {`• ${status}`}
              </Text>
            </View>
          )}
          {!!(display.title || display.name) && (
            <Text style={{ fontSize: 14, color: '#3A3A3C', marginTop: 8 }}>
              {safeString(display.title || display.name, '')}
            </Text>
          )}
        </View>

        {/* Invoice Info */}
        <View style={styles.sectionCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Invoice number</Text>
            <Text style={styles.infoValue}>
              {safeString(display.invoiceNumber || display.invoice, '—')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From</Text>
            <Text style={styles.infoValue}>
              {safeString(display.from || chat.title, '—')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Issued date</Text>
            <Text style={styles.infoValue}>
              {safeString(display.issuedDate, '—')}
            </Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Due date</Text>
            <Text style={styles.infoValue}>
              {safeString(display.dueDate, '—')}
            </Text>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>LINE ITEMS</Text>
          {lineItems.length === 0 ? (
            <View style={styles.infoRow}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
                {safeString(display.title || display.name, 'Item')}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
                {amountDisplay}
              </Text>
            </View>
          ) : (
            lineItems.map((item, idx) => (
              <View key={item.id || idx} style={styles.infoRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
                    {safeString(item.name || item.title, '')}
                  </Text>
                  {!!(item.sub || item.subtitle || item.description) && (
                    <Text style={{ fontSize: 11, color: '#8E8E93' }}>
                      {safeString(item.sub || item.subtitle || item.description, '')}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>
                  {safeString(item.amount, '')}
                </Text>
              </View>
            ))
          )}
          <View style={[styles.infoRow, { borderBottomWidth: 0, marginTop: 6 }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>Total</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>
              {amountDisplay}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>TIMELINE</Text>
          {timeline.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#8E8E93' }}>No timeline events</Text>
          ) : (
            timeline.map((event, idx) => (
              <View
                key={event.id || idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: idx < timeline.length - 1 ? 8 : 0,
                }}
              >
                <Ionicons
                  name={event.icon || 'checkmark-circle'}
                  size={16}
                  color={event.color || '#007AFF'}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontSize: 13, color: '#3A3A3C', flex: 1 }}>
                  {safeString(event.text || event.description, '')}
                </Text>
                <Text style={{ fontSize: 12, color: '#8E8E93' }}>
                  {safeString(event.date, '')}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.payButton, !canPay && styles.payButtonDisabled]}
        disabled={!canPay || isProcessing}
        onPress={handlePayBill}
        activeOpacity={0.7}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.payButtonText}>
            {isPaid ? 'Paid' : 'Submit & Pay Bill'}
          </Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}