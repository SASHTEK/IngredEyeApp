import { supabase } from './supabaseClient';
import rootsClient from './rootsBendaClient';

// Generate batch ID
export const generateBatchId = () => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 8);
};

// Check ingredients via Roots by Benda MCP
export const checkIngredientsDb = async (ingredientsText) => {
  return rootsClient.checkIngredients(ingredientsText);
};

//Pin results to Database
export const pinItemsToDb = async (user, itemsToPin) => {
  if (!user) return { success: false, error: "Please log in to pin items." };
  if (!itemsToPin || itemsToPin.length === 0) return { success: false, error: "No risks found to pin." };

  const { error } = await supabase.from('pinned_items').insert(itemsToPin);
  
  if (error) return { success: false, error: error.message };
  return { success: true };
};

// Pin items from a community post to user's pinned items
export const pinFromPost = async (user, post) => {
  if (!user) return { success: false, error: 'Please log in to pin items.' };
  if (!post || !post.items) return { success: false, error: 'No items found in this post.' };

  const items = typeof post.items === 'string' ? JSON.parse(post.items) : post.items;

  if (!items || items.length === 0) return { success: false, error: 'No items found in this post.' };

  const batchId = post.batch_id || generateBatchId();

  const itemsToPin = items.map(item => ({
    user_id: user.id,
    batch_id: batchId,
    product_name: post.product_name || 'Unknown Product',
    brand: post.brand || 'N/A',
    keyword: item.keyword,
    risk: item.risk,
    severity: item.severity,
    e_number: item.e_number,
    category: item.category,
    safety_score: item.safety_score,
    iarc_group: item.iarc_group,
    pregnancy_safe: item.pregnancy_safe,
    children_safe: item.children_safe,
    common_foods: item.common_foods,
    source: 'community',
  }));

  return pinItemsToDb(user, itemsToPin);
};


