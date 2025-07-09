import { auth } from '../config/firebase';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';

export const authService = {
  async signInAnonymous() {
    try {
      const result = await signInAnonymously(auth);
      return result.user;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  },

  // Cerrar sesión
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Observar cambios de autenticación
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Obtener usuario actual
  getCurrentUser() {
    return auth.currentUser;
  }
};