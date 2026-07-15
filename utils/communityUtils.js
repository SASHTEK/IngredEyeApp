import { supabase } from './supabaseClient';

// Share posts
export const sharePost = async (user, { product_name, brand, batch_id, items, caption, is_anonymous }) => {
  const { data: userData } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single();

  const { error } = await supabase.from('community_posts').insert({
    user_id: user.id,
    username: is_anonymous ? null : userData?.username,
    is_anonymous,
    product_name,
    brand,
    batch_id,
    items,
    caption: caption || null,
  });

  return { success: !error, error: error?.message };
};

// Fetch Posts
export const fetchPosts = async (userId) => {
  const { data: posts, error } = await supabase
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { posts: [], error: error.message };

  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      const { count: likesCount } = await supabase
        .from('community_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      const { count: commentsCount } = await supabase
        .from('community_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      let userLiked = false;
      if (userId) {
        const { data: like } = await supabase
          .from('community_post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .maybeSingle();
        userLiked = !!like;
      }

      return { ...post, likesCount: likesCount || 0, commentsCount: commentsCount || 0, userLiked };
    })
  );

  return { posts: postsWithCounts, error: null };
};

// Likes
export const toggleLike = async (postId, userId) => {
  const { data: existing } = await supabase
    .from('community_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('community_post_likes').delete().eq('id', existing.id);
    return { liked: false };
  } else {
    await supabase.from('community_post_likes').insert({ post_id: postId, user_id: userId });
    return { liked: true };
  }
};

// Fetch Comments
export const fetchComments = async (postId) => {
  const { data, error } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  return { comments: data || [], error: error?.message };
};

// Add Comments
export const addComment = async (postId, userId, content) => {
  const { data: userData } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .single();

  const { error } = await supabase.from('community_comments').insert({
    post_id: postId,
    user_id: userId,
    username: userData?.username,
    content,
  });

  return { success: !error, error: error?.message };
};

// Fetch unseen post count
export const fetchUnseenCount = async (userId) => {
  if (!userId) return 0;

  const { data } = await supabase
    .from('user_community_seen')
    .select('last_seen_at')
    .eq('user_id', userId)
    .maybeSingle();

  const lastSeenAt = data?.last_seen_at;

  let query = supabase
    .from('community_posts')
    .select('id', { count: 'exact', head: true });

  if (lastSeenAt) {
    query = query.gt('created_at', lastSeenAt);
  }

  const { count } = await query;

  return count || 0;
};

// Update last seen time
export const updateLastSeen = async (userId) => {
  if (!userId) return;

  const { error } = await supabase
    .from('user_community_seen')
    .upsert(
      { user_id: userId, last_seen_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  return { success: !error, error: error?.message };
};
