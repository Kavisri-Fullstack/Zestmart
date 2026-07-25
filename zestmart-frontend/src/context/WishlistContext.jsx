import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { wishlistApi } from '../api/wishlist.api';
import { extractError } from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState({ items: [] });

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist({ items: [] });
      return;
    }
    try {
      const res = await wishlistApi.get();
      setWishlist(res.data.data.wishlist);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const productIds = (wishlist.items || []).map((i) => i.productId?._id || i.productId);

  const isWishlisted = (productId) => productIds.includes(productId);

  const toggleWishlist = async (productId) => {
    try {
      if (isWishlisted(productId)) {
        const res = await wishlistApi.removeItem(productId);
        setWishlist(res.data.data.wishlist);
        toast.success('Removed from wishlist');
      } else {
        const res = await wishlistApi.addItem(productId);
        setWishlist(res.data.data.wishlist);
        toast.success('Saved to wishlist');
      }
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlist, refreshWishlist, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
