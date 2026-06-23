import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, RefreshControl
} from 'react-native';
import { supabase } from '../utils/supabaseClient';
import { fetchPosts, toggleLike, fetchComments, addComment } from '../utils/communityUtils';

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function ShareScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [showLowPosts, setShowLowPosts] = useState({});

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSubmitLoading, setCommentSubmitLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (user !== undefined) loadPosts();
  }, [user]);

  const loadPosts = async () => {
    const result = await fetchPosts(user?.id);
    setPosts(result.posts || []);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [user]);

  const handleLike = async (postId) => {
    if (!user) { Alert.alert('Login Required', 'Sign in to like posts.'); return; }
    const result = await toggleLike(postId, user.id);
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, userLiked: result.liked, likesCount: p.likesCount + (result.liked ? 1 : -1) }
        : p
    ));
  };

  const openComments = async (post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
    setCommentLoading(true);
    const result = await fetchComments(post.id);
    setComments(result.comments || []);
    setCommentLoading(false);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !user || !selectedPost) return;
    setCommentSubmitLoading(true);
    const result = await addComment(selectedPost.id, user.id, commentInput.trim());
    if (result.success) {
      setComments(prev => [...prev, {
        id: Date.now().toString(),
        user_id: user.id,
        username: user.username || 'You',
        content: commentInput.trim(),
        created_at: new Date().toISOString(),
      }]);
      setPosts(prev => prev.map(p =>
        p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p
      ));
      setCommentInput('');
    } else {
      Alert.alert('Error', result.error || 'Failed to add comment.');
    }
    setCommentSubmitLoading(false);
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'critical': return { bg: '#ffebee', text: '#c62828' };
      case 'high': return { bg: '#fff3e0', text: '#ef6c00' };
      case 'medium': return { bg: '#fffbf2', text: '#fbc02d' };
      case 'low': return { bg: '#e8f5e9', text: '#2e7d32' };
      default: return { bg: '#f5f5f5', text: '#333' };
    }
  };

  const renderPost = (post) => {
    const items = typeof post.items === 'string' ? JSON.parse(post.items) : (post.items || []);

    const sorted = [...items].sort((a, b) => {
      const sa = SEVERITY_ORDER[a.severity] ?? 99;
      const sb = SEVERITY_ORDER[b.severity] ?? 99;
      return sa - sb;
    });

    const highItems = sorted.filter(i => i.severity !== 'low');
    const lowItems = sorted.filter(i => i.severity === 'low');
    const showLow = showLowPosts[post.id] || false;

    return (
      <View key={post.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.is_anonymous ? '👻' : (post.username ? post.username[0].toUpperCase() : '?')}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{post.is_anonymous ? 'Anonymous' : post.username}</Text>
            <Text style={styles.timestamp}>{formatDate(post.created_at)}</Text>
          </View>
        </View>

        <Text style={styles.productName}>{post.product_name || 'Unknown Product'}</Text>
        {post.brand ? <Text style={styles.brand}>{post.brand}</Text> : null}

        {highItems.map((item, idx) => {
          const sev = getSeverityStyle(item.severity);
          return (
            <View key={idx} style={styles.riskItem}>
              <Text style={styles.riskKeyword}>{item.keyword}</Text>
              <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                <Text style={[styles.severityText, { color: sev.text }]}>{item.severity.toUpperCase()}</Text>
              </View>
            </View>
          );
        })}

        {lowItems.length > 0 && (
          <TouchableOpacity
            style={styles.lowToggle}
            onPress={() => setShowLowPosts(prev => ({ ...prev, [post.id]: !showLow }))}
          >
            <Text style={styles.lowToggleText}>
              {showLow ? '▲' : '▼'} {lowItems.length} Low Severity
            </Text>
          </TouchableOpacity>
        )}

        {showLow && lowItems.map((item, idx) => {
          const sev = getSeverityStyle(item.severity);
          return (
            <View key={`low-${idx}`} style={styles.riskItem}>
              <Text style={styles.riskKeyword}>{item.keyword}</Text>
              <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                <Text style={[styles.severityText, { color: sev.text }]}>{item.severity.toUpperCase()}</Text>
              </View>
            </View>
          );
        })}

        {post.caption ? <Text style={styles.caption}>"{post.caption}"</Text> : null}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(post.id)}>
            <Text style={[styles.actionIcon, post.userLiked && styles.liked]}>
              {post.userLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.actionCount}>{post.likesCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(post)}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{post.commentsCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌐 Share</Text>
        <Text style={styles.subtitle}>Discover what others are finding</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" colors={['#2e7d32']} />}
        >
          {posts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No shared items yet</Text>
              <Text style={styles.emptySub}>Pin and share your scans with the community!</Text>
            </View>
          ) : posts.map(renderPost)}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <Modal visible={commentModalVisible} transparent animationType="slide">
        <View style={styles.commentOverlay}>
          <View style={styles.commentModal}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <Text style={styles.commentProduct}>{selectedPost.product_name}</Text>
            )}

            <ScrollView style={styles.commentList}>
              {commentLoading ? (
                <ActivityIndicator color="#2e7d32" style={{ marginTop: 20 }} />
              ) : comments.length === 0 ? (
                <Text style={styles.noComments}>No comments yet. Be the first!</Text>
              ) : (
                comments.map(c => (
                  <View key={c.id} style={styles.commentItem}>
                    <Text style={styles.commentUser}>{c.username || 'Anonymous'}</Text>
                    <Text style={styles.commentContent}>{c.content}</Text>
                    <Text style={styles.commentTime}>{formatDate(c.created_at)}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#999"
                value={commentInput}
                onChangeText={setCommentInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!commentInput.trim() || commentSubmitLoading) && styles.sendBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentInput.trim() || commentSubmitLoading}
              >
                <Text style={styles.sendText}>{commentSubmitLoading ? '...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faf8' },
  header: { paddingTop: 50, paddingBottom: 15, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 25, fontWeight: '800', color: '#2e7d32' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 3 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { fontSize: 18 },
  headerInfo: { flex: 1 },
  username: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  timestamp: { fontSize: 11, color: '#999', marginTop: 1 },
  productName: { fontSize: 17, fontWeight: 'bold', color: '#1b5e20', marginBottom: 2 },
  brand: { fontSize: 13, color: '#666', marginBottom: 10 },
  lowToggle: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  lowToggleText: { color: '#666', fontWeight: '600', fontSize: 12 },
  riskItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  riskKeyword: { fontSize: 14, fontWeight: '600', color: '#444' },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  severityText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  caption: { fontStyle: 'italic', color: '#666', fontSize: 13, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  cardActions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionIcon: { fontSize: 16, marginRight: 4 },
  liked: {},
  actionCount: { fontSize: 13, color: '#666', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#999' },
  emptySub: { fontSize: 13, color: '#bbb', marginTop: 5 },

  commentOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', padding: 20 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  commentTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeBtn: { fontSize: 20, color: '#999', padding: 5 },
  commentProduct: { fontSize: 13, color: '#2e7d32', fontWeight: '600', marginBottom: 12 },
  commentList: { maxHeight: 300, marginBottom: 12 },
  noComments: { textAlign: 'center', color: '#999', marginTop: 30, fontStyle: 'italic' },
  commentItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  commentUser: { fontWeight: 'bold', fontSize: 13, color: '#2e7d32' },
  commentContent: { fontSize: 14, color: '#444', marginTop: 3 },
  commentTime: { fontSize: 10, color: '#bbb', marginTop: 3 },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  commentInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 80, color: '#333' },
  sendBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginLeft: 8 },
  sendBtnDisabled: { backgroundColor: '#a5d6a7' },
  sendText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
