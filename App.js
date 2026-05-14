import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'si', name: 'Sinhala', native: 'සිංහල' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'ps', name: 'Pashto', native: 'پښتو' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'no', name: 'Norwegian', native: 'Norsk' },
  { code: 'da', name: 'Danish', native: 'Dansk' },
  { code: 'fi', name: 'Finnish', native: 'Suomi' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά' }
];

const THEMES = {
  dark: {
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    subtext: '#94a3b8',
    primary: '#3b82f6',
    border: '#334155'
  },
  light: {
    bg: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    subtext: '#64748b',
    primary: '#3b82f6',
    border: '#e2e8f0'
  }
};

export default function App() {
  const [sourceLang, setSourceLang] = useState(LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState(LANGUAGES[1]);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [showLangModal, setShowLangModal] = useState(false);
  const [langSelectType, setLangSelectType] = useState('source');
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const colors = THEMES[theme];

  useEffect(() => {
    loadHistory();
    loadTheme();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem('translation_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.log(e);
    }
  };

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      if (saved) setTheme(saved);
    } catch (e) {
      console.log(e);
    }
  };

  const saveHistory = async (newItem) => {
    try {
      const updated = [newItem,...history].slice(0, 50);
      setHistory(updated);
      await AsyncStorage.setItem('translation_history', JSON.stringify(updated));
    } catch (e) {
      console.log(e);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark'? 'light' : 'dark';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const translateText = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      // Using MyMemory free translation API
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(inputText)}&langpair=${sourceLang.code}|${targetLang.code}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.responseStatus === 200) {
        const translated = data.responseData.translatedText;
        setOutputText(translated);
        saveHistory({
          id: Date.now().toString(),
          source: inputText,
          translated: translated,
          from: sourceLang.code,
          to: targetLang.code,
          timestamp: new Date().toISOString()
        });
      } else {
        Alert.alert('Error', 'Translation failed. Try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Check your internet connection');
    }
    setLoading(false);
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const speakText = (text, lang) => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language: lang,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false)
    });
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Text copied to clipboard');
  };

  const shareText = async (text) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync('', { dialogTitle: text });
    }
  };

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native.includes(searchQuery)
  );

  const renderLanguageItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.langItem, { borderBottomColor: colors.border }]}
      onPress={() => {
        if (langSelectType === 'source') setSourceLang(item);
        else setTargetLang(item);
        setShowLangModal(false);
        setSearchQuery('');
      }}
    >
      <Text style={[styles.langName, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.langNative, { color: colors.subtext }]}>{item.native}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={theme === 'dark'? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>LingoLive</Text>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
          <Ionicons name={theme === 'dark'? 'sunny' : 'moon'} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Language Selector */}
        <View style={[styles.langSelector, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.langBox}
            onPress={() => { setLangSelectType('source'); setShowLangModal(true); }}
          >
            <Text style={[styles.langLabel, { color: colors.subtext }]}>From</Text>
            <Text style={[styles.langText, { color: colors.text }]}>{sourceLang.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={swapLanguages} style={styles.swapBtn}>
            <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langBox}
            onPress={() => { setLangSelectType('target'); setShowLangModal(true); }}
          >
            <Text style={[styles.langLabel, { color: colors.subtext }]}>To</Text>
            <Text style={[styles.langText, { color: colors.text }]}>{targetLang.name}</Text>
          </TouchableOpacity>
        </View>

        {/* Input Box */}
        <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Enter text..."
            placeholderTextColor={colors.subtext}
            multiline
            value={inputText}
            onChangeText={setInputText}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity onPress={() => speakText(inputText, sourceLang.code)}>
              <Ionicons name={speaking? "stop-circle" : "volume-high"} size={24} color={colors.subtext} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setInputText('')}>
              <Ionicons name="close-circle" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Translate Button */}
        <TouchableOpacity
          style={[styles.translateBtn, { backgroundColor: colors.primary }]}
          onPress={translateText}
          disabled={loading}
        >
          {loading? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.translateBtnText}>Translate</Text>
          )}
        </TouchableOpacity>

        {/* Output Box */}
        {outputText? (
          <View style={[styles.outputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.outputText, { color: colors.text }]}>{outputText}</Text>
            <View style={styles.outputActions}>
              <TouchableOpacity onPress={() => speakText(outputText, targetLang.code)}>
                <Ionicons name="volume-high" size={24} color={colors.subtext} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => copyToClipboard(outputText)}>
                <Ionicons name="copy-outline" size={24} color={colors.subtext} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => shareText(outputText)}>
                <Ionicons name="share-outline" size={24} color={colors.subtext} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent</Text>
            {history.slice(0, 5).map(item => (
              <TouchableOpacity
                key={item.id}
                style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  setInputText(item.source);
                  setOutputText(item.translated);
                }}
              >
                <Text style={[styles.historyText, { color: colors.text }]} numberOfLines={1}>
                  {item.source}
                </Text>
                <Text style={[styles.historyTextSub, { color: colors.subtext }]} numberOfLines={1}>
                  {item.translated}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={showLangModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLangModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.searchInput, {
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="Search language..."
              placeholderTextColor={colors.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredLanguages}
              keyExtractor={item => item.code}
              renderItem={renderLanguageItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  themeBtn: { padding: 8 },
  content: { padding: 16 },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  langBox: { flex: 1 },
  langLabel: { fontSize: 12, marginBottom: 4 },
  langText: { fontSize: 16, fontWeight: '600' },
  swapBtn: { padding: 12 },
  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  textInput: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12
  },
  translateBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  translateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  outputBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  outputText: { fontSize: 16, marginBottom: 12 },
  outputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16
  },
  historySection: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8
  },
  historyText: { fontSize: 15, fontWeight: '500' },
  historyTextSub: { fontSize: 14, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    fontSize: 16
  },
  langItem: {
    padding: 16,
    borderBottomWidth: 1
  },
  langName: { fontSize: 16, fontWeight: '500' },
  langNative: { fontSize: 14, marginTop: 4 }
});
