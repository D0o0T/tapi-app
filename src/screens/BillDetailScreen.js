import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/Style';
import { colors } from '../constants/theme';
import { searchApi } from '../services/apiService';

function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

export default function BillDetailScreen({ route, navigation }) {
  const { billId, bill: routeBill } = route?.params || {};
  const seed = routeBill && typeof routeBill === 'object' ? routeBill : {};

  // State variables for bill details, payment processing, and status
  const [bill, setBill] = useState(seed);
  const [status, setStatus] = useState(safeString(seed?.status, 'AWAITING PAYMENT'));
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch bill details with fallback
  const fetchBillDetails = useCallback(async () => {
    const id = billId || seed?.id;
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await searchApi.getBillDetail(id);
      const payload = data?.bill || data;
      if (payload && typeof payload === 'object') {
        setBill((prev) => ({ ...prev, ...payload }));
        if (payload.status) {
          setStatus(payload.status);
        }
      }
    } catch (_) {
      // Keep seed data if server is unreachable
    } finally {
      setIsLoading(false);
    }
  }, [billId, seed?.id]);

  useEffect(() => {
    fetchBillDetails();
  }, [fetchBillDetails]);

  const statusUpper = (status || '').toUpperCase();
  const isPaid = statusUpper.includes('PAID');
  const isOfferPending = statusUpper.includes('OFFER') || statusUpper.includes('PENDING');

  // Submit & Pay button activation criteria per PRD specification
  const canPay = !isPaid && !isOfferPending;

  // Process payment flow
  const handlePayBill = async () => {
    if (!canPay || isProcessing) return;

    setIsProcessing(true);
    try {
      const id = billId || bill?.id;
      await searchApi.payBill(id);

      setStatus('PAID');
      setBill((prev) => {
        const updatedTimeline = prev?.timeline ? [...prev.timeline] : [];
        updatedTimeline.unshift({
          id: `tl-paid-${Date.now()}`,
          icon: 'checkmark-circle',
          color: colors.success,
          description: 'Paid via Payment Gateway',
          date: 'Just now',
        });
        return {
          ...prev,
          status: 'PAID',
          payable: false,
          timeline: updatedTimeline,
        };
      });

      Alert.alert('Payment Successful', 'The bill has been paid and marked as PAID.');
    } catch (err) {
      Alert.alert(
        'Payment Failed',
        'Could not process payment at this time. Please retry.',
        [{ text: 'Retry', onPress: handlePayBill }, { text: 'Cancel', style: 'cancel' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusPillColor = () => {
    const s = statusUpper;
    if (s.includes('PAID')) return { bg: colors.successBg, text: colors.success };
    if (s.includes('OVERDUE')) return { bg: colors.dangerBg, text: colors.danger };
    if (s.includes('YOU OWE') || s.includes('OFFER') || s.includes('PENDING')) {
      return { bg: colors.warningBg, text: colors.warningText };
    }
    return { bg: colors.primaryLight, text: colors.primary };
  };

  const getAmountDirectionLabel = () => {
    if (statusUpper.includes('YOU OWE') || bill?.direction === 'iOwe') {
      return 'You owe';
    }
    if (statusUpper.includes('PAID')) {
      return 'Paid';
    }
    return 'Owed to you';
  };

  const display = bill || {};
  const chat = display.chat || {};
  const lineItems = Array.isArray(display.lineItems) ? display.lineItems : [];
  const timeline = Array.isArray(display.timeline) ? display.timeline : [];
  const amountDisplay =
    display.amountLabel || (display.amount != null ? `$${display.amount}` : '$4,500');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Detail Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Search</Text>
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Bill</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && !display.title ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Source Chat Card */}
          <TouchableOpacity
            style={styles.sourceChatCard}
            activeOpacity={0.7}
            onPress={() => {
              if (chat.id) {
                navigation.navigate('ChatDetail', {
                  chatId: chat.id,
                  chat,
                });
              }
            }}
          >
            <View
              style={[
                styles.avatarCircleSmall,
                {
                  backgroundColor: chat.avatarColor || colors.primary,
                  marginRight: 12,
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
                {safeString(chat.title, 'Acme Corp Restructure')}
              </Text>
              <Text style={styles.sourceChatSub}>
                {safeString(chat.contextLabel, 'Group · open chat')}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Amount Hero Section */}
          <View style={styles.amountHeroContainer}>
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
              {getAmountDirectionLabel()}
            </Text>

            <Text style={styles.heroAmountText}>{amountDisplay}</Text>

            {/* Status Pill */}
            <View
              style={[
                styles.statusBadgeSmall,
                { backgroundColor: getStatusPillColor().bg, marginTop: 4 },
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

            <Text style={{ fontSize: 15, color: colors.textTertiary, marginTop: 10, fontWeight: '500' }}>
              {safeString(display.title, 'Invoice')}
            </Text>
          </View>

          {/* Invoice Information */}
          <View style={styles.sectionCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invoice number</Text>
              <Text style={styles.infoValue}>
                {safeString(display.invoiceNo || display.code, '#BIL-4021')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>From</Text>
              <Text style={styles.infoValue}>
                {safeString(display.from || chat.title, 'Acme Corp')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Issued date</Text>
              <Text style={styles.infoValue}>
                {safeString(display.issuedDate || display.issued, 'Oct 31, 2025')}
              </Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Due date</Text>
              <Text style={styles.infoValue}>
                {safeString(display.dueDate, 'Nov 14, 2025')}
              </Text>
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>LINE ITEMS</Text>
            {lineItems.length === 0 ? (
              <View style={styles.infoRow}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                  {safeString(display.title, 'Consulting services')}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                  {amountDisplay}
                </Text>
              </View>
            ) : (
              lineItems.map((item, idx) => (
                <View key={String(item.id || idx)} style={styles.infoRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                      {safeString(item.name, '')}
                    </Text>
                    {!!item.sub && (
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        {item.sub}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                    {safeString(item.amount, '')}
                  </Text>
                </View>
              ))
            )}

            {/* Total Row */}
            <View style={[styles.infoRow, { borderBottomWidth: 0, marginTop: 8 }]}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                Total
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                {safeString(display.total, amountDisplay)}
              </Text>
            </View>
          </View>

          {/* Lifecycle Timeline */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>TIMELINE</Text>
            {timeline.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>No timeline events</Text>
            ) : (
              timeline.map((event, idx) => (
                <View
                  key={String(event.id || idx)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: idx < timeline.length - 1 ? 12 : 0,
                  }}
                >
                  <Ionicons
                    name={event.icon || 'checkmark-circle'}
                    size={18}
                    color={event.color || colors.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ fontSize: 13, color: colors.textTertiary, flex: 1 }}>
                    {safeString(event.description || event.text, '')}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    {safeString(event.date, '')}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Submit & Pay Bill Button */}
      <TouchableOpacity
        style={[styles.payButton, !canPay && styles.payButtonDisabled]}
        disabled={!canPay || isProcessing}
        onPress={handlePayBill}
        activeOpacity={0.8}
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
