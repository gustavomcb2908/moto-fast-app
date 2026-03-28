import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getFAQCategories, filterFAQByCategory, FAQItem } from '@/constants/faq';
import { Send, ChevronDown, Search } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabType = 'faq' | 'chat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: string;
  avatar?: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Olá! Como posso ajudá-lo hoje?',
    sender: 'support',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    text: 'Olá, tenho uma dúvida sobre o pagamento do aluguel.',
    sender: 'user',
    timestamp: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
  },
  {
    id: '3',
    text: 'Claro! Você pode realizar o pagamento através da aba "Locadora". Posso ajudar com mais alguma coisa?',
    sender: 'support',
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
];

export default function SupportScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [expandedFAQId, setExpandedFAQId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef<FlatList>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  const categories = getFAQCategories();
  const filteredFAQs = filterFAQByCategory(selectedCategory).filter((item) =>
    searchQuery
      ? item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText.trim(),
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessageText('');

      setTimeout(() => {
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          text: 'Obrigado pela sua mensagem! Nossa equipe irá responder em breve.',
          sender: 'support',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 1000);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      const anyEvent = e as unknown as { endCoordinates?: { height?: number } };
      const height = anyEvent.endCoordinates?.height ?? 0;
      setKeyboardHeight(height);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'faq' && styles.tabActive]}
        onPress={() => setActiveTab('faq')}
        activeOpacity={0.7}
        testID="support-tab-faq"
      >
        <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>FAQ</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
        onPress={() => setActiveTab('chat')}
        activeOpacity={0.7}
        testID="support-tab-chat"
      >
        <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFAQItem = ({ item }: { item: FAQItem }) => {
    const isExpanded = expandedFAQId === item.id;

    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => setExpandedFAQId(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{item.question}</Text>
          <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
            <ChevronDown size={20} color={colors.primary} />
          </View>
        </View>
        {isExpanded && (
          <View style={styles.faqAnswerContainer}>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
            <View style={styles.faqCategoryBadge}>
              <Text style={styles.faqCategoryText}>{item.category}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageContainer, isUser && styles.messageContainerUser]}>
        {!isUser && (
          <View style={styles.supportAvatar}>
            <Text style={styles.supportAvatarText}>S</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.messageBubbleUser : styles.messageBubbleSupport]}>
          <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
            {new Date(item.timestamp).toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFAQTab = () => (
    <View style={styles.faqContainer}>
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar perguntas..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
        testID="faq-categories-scroll"
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredFAQs}
        renderItem={renderFAQItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.faqList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhum resultado encontrado</Text>
          </View>
        }
      />
    </View>
  );

  const renderChatTab = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 + insets.top : 0}
      enabled
    >
      <FlatList
        ref={scrollViewRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: insets.bottom + 8 + (Platform.OS !== 'web' ? keyboardHeight : 0) }
        ]}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <View style={[
        styles.inputContainer,
        { paddingBottom: 12 + insets.bottom + (Platform.OS !== 'web' ? Math.max(0, keyboardHeight * 0.1) : 0) }
      ]}>
        <TextInput
          style={styles.messageInput}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={colors.textLight}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
          onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
          activeOpacity={0.7}
        >
          <Send size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      {renderTabBar()}
      {activeTab === 'faq' ? renderFAQTab() : renderChatTab()}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
    },
    faqContainer: {
      flex: 1,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
    },
    categoriesScroll: {
      maxHeight: 64,
    },
    categoriesContent: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
      alignItems: 'center',
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 38,
      minWidth: 80,
      alignItems: 'center',
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
    categoryChipText: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.text,
    },
    categoryChipTextActive: {
      color: colors.surface,
    },
    faqList: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
    },
    faqItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    faqHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    faqQuestion: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginRight: 12,
    },
    faqAnswerContainer: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    faqAnswer: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 12,
    },
    faqCategoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    faqCategoryText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    emptyState: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    chatContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    messagesList: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    messageContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    messageContainerUser: {
      justifyContent: 'flex-end',
    },
    messageBubble: {
      maxWidth: '70%',
      padding: 12,
      borderRadius: 16,
    },
    messageBubbleUser: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    messageBubbleSupport: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    messageTextUser: {
      color: colors.surface,
    },
    messageTime: {
      fontSize: 11,
      color: colors.textLight,
      marginTop: 4,
    },
    messageTimeUser: {
      color: colors.surface + 'CC',
    },
    supportAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    supportAvatarText: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.surface,
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.textSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    userAvatarText: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.surface,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    messageInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      maxHeight: 100,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
  });
