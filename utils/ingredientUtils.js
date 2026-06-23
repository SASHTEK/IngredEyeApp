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


