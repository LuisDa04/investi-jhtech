import { useState, useEffect } from "react"  
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Image, Alert, Modal, FlatList, ActivityIndicator } from "react-native"  
import { useTranslation } from "react-i18next"  
import { ArrowLeft, ChevronDown, Camera, Video, Star, FileText, Users, BarChart3, Check, X } from "lucide-react-native"  
import { createPost, getCurrentUser, getUserCommunities } from "../rest/api"  
import { useAuthGuard } from "../hooks/useAuthGuard"
import * as ImagePicker from 'expo-image-picker'  
  
interface Community {  
  id: string  
  name: string  
  image_url: string  
}  
  
export function CreatePostScreen({ navigation }: any) {  
  const { t } = useTranslation()  
  const [content, setContent] = useState("")  
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)  
  const [communities, setCommunities] = useState<Community[]>([])  
  const [loading, setLoading] = useState(false)  
  const [loadingData, setLoadingData] = useState(true)  
  const [showCommunityModal, setShowCommunityModal] = useState(false)  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const [postType, setPostType] = useState<'text' | 'celebration' | 'poll' | 'partnership'>('text')  
  
  useAuthGuard()  
  
  useEffect(() => {  
    loadUserData()  
  }, [])  
  
  const loadUserData = async () => {  
    try {  
      setLoadingData(true)  
      const user = await getCurrentUser()  
      if (user) {  
        setCurrentUser(user)  
        const userCommunities = await getUserCommunities(user.id)  
          
        const communitiesList = [  
          { id: 'public', name: 'Público', image_url: '' },  
          ...userCommunities  
        ]  
          
        setCommunities(communitiesList)  
        setSelectedCommunity(communitiesList[0])  
      }  
    } catch (error) {  
      console.error('Error loading user data:', error)  
      Alert.alert('Error', 'No se pudieron cargar los datos del usuario')  
    } finally {  
      setLoadingData(false)  
    }  
  }  
  
  const handlePublish = async () => {  
    if (!content.trim()) {  
      Alert.alert('Error', 'Por favor escribe algo antes de publicar')  
      return  
    }  
  
    setLoading(true)  
    try {  
      if (currentUser) {  
        const postData = {  
          user_id: currentUser.id,  
          contenido: content.trim(),  
          media_url: [],  
          ...(selectedCommunity?.id !== 'public' && { community_id: selectedCommunity?.id })  
        }  
  
        await createPost(postData)  
        Alert.alert('Éxito', 'Publicación creada correctamente', [  
          { text: 'OK', onPress: () => navigation.goBack() }  
        ])  
      }  
    } catch (error) {  
      console.error("Error creating post:", error)  
      Alert.alert('Error', 'No se pudo crear la publicación')  
    } finally {  
      setLoading(false)  
    }  
  }  
  
  const handleMediaPicker = async (type: 'photo' | 'video') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Necesitamos permisos para acceder a tu galería')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(prev => [...prev, result.assets[0].uri])
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo')
    }
  }

  const handlePostTypeChange = (type: 'celebration' | 'poll' | 'partnership') => {
    setPostType(type)
    switch (type) {
      case 'celebration':
        setContent('🎉 ¡Celebremos! ')
        break
      case 'poll':
        setContent('📊 Encuesta: ')
        break
      case 'partnership':
        setContent('🤝 Busco socio para: ')
        break
    }
  }

  const handleOptionPress = (optionKey: string) => {
    switch (optionKey) {
      case 'photo':
        handleMediaPicker('photo')
        break
      case 'video':
        handleMediaPicker('video')
        break
      case 'celebrate':
        handlePostTypeChange('celebration')
        break
      case 'poll':
        handlePostTypeChange('poll')
        break
      case 'partner':
        handlePostTypeChange('partnership')
        break
      case 'document':
        Alert.alert('Próximamente', 'Funcionalidad de documentos en desarrollo')
        break
    }
  }

  const postOptions = [
    { key: 'photo', icon: Camera, label: t("createPost.addPhoto"), color: "#666" },
    { key: 'video', icon: Video, label: t("createPost.addVideo"), color: "#666" },
    { key: 'celebrate', icon: Star, label: t("createPost.celebrate"), color: "#666" },
    { key: 'document', icon: FileText, label: t("createPost.addDocument"), color: "#666" },
    { key: 'partner', icon: Users, label: t("createPost.findPartner"), color: "#666" },
    { key: 'poll', icon: BarChart3, label: t("createPost.createPoll"), color: "#666" },
  ]
  
  if (loadingData) {  
    return (  
      <SafeAreaView style={styles.container}>  
        <View style={styles.loadingContainer}>  
          <ActivityIndicator size="large" color="#007AFF" />  
          <Text style={styles.loadingText}>Cargando...</Text>  
        </View>  
      </SafeAreaView>  
    )  
  }  
  
  return (  
    <SafeAreaView style={styles.container}>  
      <View style={styles.header}>  
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>  
          <ArrowLeft size={24} color="#111" />  
        </TouchableOpacity>  
        <Text style={styles.headerTitle}>{t("createPost.title")}</Text>  
        <TouchableOpacity  
          style={[styles.publishButton, (!content.trim() || loading) && styles.publishButtonDisabled]}  
          onPress={handlePublish}  
          disabled={loading || !content.trim()}  
        >  
          {loading ? (  
            <ActivityIndicator size="small" color="#007AFF" />  
          ) : (  
            <Text style={[styles.publishButtonText, { color: content.trim() ? "#007AFF" : "#ccc" }]}>  
              {t("createPost.publish")}  
            </Text>  
          )}  
        </TouchableOpacity>  
      </View>  
  
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>  
        <View style={styles.userContainer}>  
          <Image  
            source={{   
              uri: currentUser?.avatar_url || currentUser?.photo_url || 'https://i.pravatar.cc/100'   
            }}  
            style={styles.avatar}  
          />  
          <View style={styles.userInfo}>  
            <Text style={styles.userName}>  
              {currentUser?.nombre || currentUser?.username || 'Usuario'}  
            </Text>  
            <TouchableOpacity  
              style={styles.communitySelector}  
              onPress={() => setShowCommunityModal(true)}  
            >  
              <View style={styles.communityIcon} />  
              <Text style={styles.communityText}>  
                {selectedCommunity?.name || 'Seleccionar'}  
              </Text>  
              <ChevronDown size={16} color="#666" />  
            </TouchableOpacity>  
          </View>  
        </View>  
  
        <View style={styles.textContainer}>  
          <TextInput  
            style={styles.textInput}  
            placeholder={t("createPost.placeholder")}  
            placeholderTextColor="#999"  
            value={content}  
            onChangeText={setContent}  
            multiline  
            textAlignVertical="top"  
            maxLength={2000}  
          />  
          <Text style={styles.characterCount}>{content.length}/2000</Text>  
        </View>  
  
        <View style={styles.dividerContainer}>  
          <View style={styles.divider} />  
        </View>  
  
        <View style={styles.optionsContainer}>  
          {postOptions.map((option, index) => (  
            <TouchableOpacity  
              key={index}  
              style={styles.option}  
              onPress={() => handleOptionPress(option.key)}  
            >  
              <option.icon size={24} color={option.color} />  
              <Text style={styles.optionText}>{option.label}</Text>  
            </TouchableOpacity>  
          ))}  
        </View>

        {/* Media Preview */}
        {selectedMedia.length > 0 && (
          <View style={styles.mediaPreview}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedMedia.map((uri, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri }} style={styles.mediaImage} />
                  <TouchableOpacity 
                    style={styles.removeMedia}
                    onPress={() => setSelectedMedia(prev => prev.filter((_, i) => i !== index))}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}  
      </ScrollView>  
  
      <Modal  
        visible={showCommunityModal}  
        transparent  
        animationType="slide"  
        onRequestClose={() => setShowCommunityModal(false)}  
      >  
        <View style={styles.modalOverlay}>  
          <View style={styles.modalContent}>  
            <View style={styles.modalHeader}>  
              <Text style={styles.modalTitle}>Seleccionar audiencia</Text>  
              <TouchableOpacity  
                onPress={() => setShowCommunityModal(false)}  
                style={styles.modalCloseIcon}  
              >  
                <X size={24} color="#666" />  
              </TouchableOpacity>  
            </View>  
              
            <FlatList  
              data={communities}  
              keyExtractor={(item) => item.id}  
              renderItem={({ item }) => (  
                <TouchableOpacity  
                  style={styles.communityItem}  
                  onPress={() => {  
                    setSelectedCommunity(item)  
                    setShowCommunityModal(false)  
                  }}  
                >  
                  <View style={styles.communityItemIcon} />  
                  <Text style={styles.communityItemText}>{item.name}</Text>  
                  {selectedCommunity?.id === item.id && (  
                    <Check size={20} color="#007AFF" />  
                  )}  
                </TouchableOpacity>  
              )}  
            />  
              
            <TouchableOpacity  
              style={styles.modalCloseButton}  
              onPress={() => setShowCommunityModal(false)}  
            >  
              <Text style={styles.modalCloseText}>Cancelar</Text>  
            </TouchableOpacity>  
          </View>  
        </View>  
      </Modal>  
  
      <View style={styles.bottomIndicator}>  
        <View style={styles.indicator} />  
      </View>  
    </SafeAreaView>  
  )  
}  
  
const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    backgroundColor: "#f7f8fa",  
  },  
  loadingContainer: {  
    flex: 1,  
    justifyContent: "center",  
    alignItems: "center",  
  },  
  loadingText: {  
    marginTop: 10,  
    fontSize: 16,  
    color: "#666",  
  },  
  header: {  
    flexDirection: "row",  
    alignItems: "center",  
    justifyContent: "space-between",  
    paddingHorizontal: 20,  
    paddingVertical: 16,  
    backgroundColor: "white",  
    borderBottomWidth: 1,  
    borderBottomColor: "#e5e5e5",  
  },  
  backButton: {  
    padding: 4,  
  },  
  headerTitle: {  
    fontSize: 18,  
    fontWeight: "600",  
    color: "#111",  
  },  
  publishButton: {  
    padding: 4,  
    minWidth: 60,  
    alignItems: "center",  
  },  
  publishButtonDisabled: {  
    opacity: 0.5,  
  },  
  publishButtonText: {  
    fontSize: 16,  
    fontWeight: "600",  
  },  
  scrollView: {  
    flex: 1,  
  },  
  userContainer: {  
    flexDirection: "row",  
    paddingHorizontal: 20,  
    paddingVertical: 20,  
    backgroundColor: "white",  
  },  
  avatar: {  
    width: 48,  
    height: 48,  
    borderRadius: 24,  
    marginRight: 12,  
  },  
  userInfo: {  
    flex: 1,  
  },  
  userName: {  
    fontSize: 16,  
    fontWeight: "600",  
    color: "#111",  
    marginBottom: 4,  
  },  
  communitySelector: {  
    flexDirection: "row",  
    alignItems: "center",  
    backgroundColor: "#f0f0f0",  
    paddingHorizontal: 12,  
    paddingVertical: 6,  
    borderRadius: 20,  
    alignSelf: "flex-start",  
  },  
  communityIcon: {  
    width: 8,  
    height: 8,  
    backgroundColor: "#007AFF",  
    borderRadius: 4,  
    marginRight: 8,  
  },  
  communityText: {  
    fontSize: 14,  
    color: "#111",  
    marginRight: 4,  
  },  
  textContainer: {  
    backgroundColor: "white",  
    paddingHorizontal: 20,  
    paddingBottom: 20,  
  },  
  textInput: {  
    fontSize: 18,  
    color: "#111",  
    minHeight: 200,  
    textAlignVertical: "top",  
    marginBottom: 10,  
  },  
  characterCount: {  
    fontSize: 12,  
    color: "#999",  
    textAlign: "right",  
  },  
  dividerContainer: {  
    alignItems: "center",  
    paddingVertical: 20,  
    backgroundColor: "white",  
  },  
  divider: {  
    width: 50,  
    height: 4,  
    backgroundColor: "#ddd",  
    borderRadius: 2,  
  },  
  optionsContainer: {  
    backgroundColor: "white",  
    paddingHorizontal: 20,  
    paddingBottom: 40,  
  },  
  option: {  
    flexDirection: "row",  
    alignItems: "center",  
    paddingVertical: 16,  
  },  
  optionText: {  
    fontSize: 16,  
    color: "#111",  
    marginLeft: 16,  
  },  
  bottomIndicator: {  
    alignItems: "center",  
    paddingVertical: 20,  
    backgroundColor: "white",  
  },  
  indicator: {  
    width: 134,  
    height: 4,  
    backgroundColor: "#111",  
    borderRadius: 2,  
  },  
  modalOverlay: {  
    flex: 1,  
    backgroundColor: 'rgba(0,0,0,0.5)',  
    justifyContent: 'flex-end',  
  },  
  modalContent: {  
    backgroundColor: 'white',  
    borderTopLeftRadius: 20,  
    borderTopRightRadius: 20,  
    padding: 20,  
    maxHeight: '70%',  
  },  
  modalHeader: {  
    flexDirection: 'row',  
    justifyContent: 'space-between',  
    alignItems: 'center',  
    marginBottom: 20,  
  },  
  modalTitle: {  
    fontSize: 18,  
    fontWeight: '600',  
    textAlign: 'center',  
    flex: 1,  
  },  
  modalCloseIcon: {  
    padding: 4,  
  },  
  communityItem: {  
    flexDirection: 'row',  
    alignItems: 'center',  
    paddingVertical: 12,  
    borderBottomWidth: 1,  
    borderBottomColor: '#f0f0f0',  
  },  
  communityItemIcon: {  
    width: 12,  
    height: 12,  
    backgroundColor: '#007AFF',  
    borderRadius: 6,  
    marginRight: 12,  
  },  
  communityItemText: {  
    flex: 1,  
    fontSize: 16,  
  },  
  modalCloseButton: {  
    marginTop: 20,  
    padding: 15,  
    backgroundColor: '#f0f0f0',  
    borderRadius: 10,  
    alignItems: 'center',  
  },  
  modalCloseText: {  
    fontSize: 16,  
    fontWeight: '600',  
  },  
  mediaPreview: {  
    backgroundColor: 'white',  
    paddingHorizontal: 20,  
    paddingVertical: 16,  
  },  
  mediaItem: {  
    position: 'relative',  
    marginRight: 12,  
  },  
  mediaImage: {  
    width: 80,  
    height: 80,  
    borderRadius: 8,  
  },  
  removeMedia: {  
    position: 'absolute',  
    top: -8,  
    right: -8,  
    backgroundColor: '#ff4444',  
    borderRadius: 12,  
    width: 24,  
    height: 24,  
    justifyContent: 'center',  
    alignItems: 'center',  
  },  
})