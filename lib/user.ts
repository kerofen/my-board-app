'use client';

const USER_ID_KEY = 'board_user_id';

export function getUserId(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isOwner(postUserId: string): boolean {
  return getUserId() === postUserId;
}