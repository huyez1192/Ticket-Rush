import { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import * as authApi from "../../api/authApi";
import { ROLES } from "../../constants/roles";
import { getRoleNames } from "../../utils/getRoleNames";
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from "./authStorage";

export const AuthContext = createContext(null);

const initialState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isLoading: Boolean(getStoredToken()),
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    case "AUTH_ERROR":
      return { ...state, user: null, token: null, isLoading: false, error: action.payload };
    case "AUTH_CLEAR":
      return { ...state, user: null, token: null, isLoading: false, error: null };
    default:
      return state;
  }
}

function normalizeAuthPayload(payload) {
  return {
    token: payload?.accessToken || payload?.token || null,
    user: payload?.user || payload || null,
  };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setAuthFromToken = useCallback((token, user) => {
    setStoredToken(token);
    setStoredUser(user);
    dispatch({ type: "AUTH_SUCCESS", payload: { token, user } });
  }, []);

  const clearAuth = useCallback(() => {
    clearAuthStorage();
    dispatch({ type: "AUTH_CLEAR" });
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      clearAuth();
      return null;
    }

    dispatch({ type: "AUTH_LOADING" });

    try {
      const user = await authApi.getMe();
      setStoredUser(user);
      dispatch({ type: "AUTH_SUCCESS", payload: { token, user } });
      return user;
    } catch (error) {
      clearAuthStorage();
      dispatch({ type: "AUTH_ERROR", payload: error });
      return null;
    }
  }, [clearAuth]);

  useEffect(() => {
    if (state.token) {
      loadCurrentUser();
    }
  }, []);

  const login = useCallback(
    async (credentials) => {
      dispatch({ type: "AUTH_LOADING" });

      try {
        const payload = normalizeAuthPayload(await authApi.login(credentials));

        if (!payload.token || !payload.user) {
          throw new Error("Login response did not include an access token and user.");
        }

        setAuthFromToken(payload.token, payload.user);
        return payload.user;
      } catch (error) {
        clearAuthStorage();
        dispatch({ type: "AUTH_ERROR", payload: error });
        throw error;
      }
    },
    [setAuthFromToken],
  );

  const register = useCallback(async (payload) => authApi.register(payload), []);

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) {
        await authApi.logout();
      }
    } catch {
      // Stateless backend logout should not block local session cleanup.
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const roleNames = useMemo(() => getRoleNames(state.user), [state.user]);
  const isAdmin = roleNames.includes(ROLES.ADMIN);
  const isCustomer = roleNames.includes(ROLES.CUSTOMER);

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      roles: roleNames,
      isAuthenticated: Boolean(state.token && state.user),
      isAdmin,
      isCustomer,
      isLoading: state.isLoading,
      error: state.error,
      login,
      register,
      logout,
      setAuthFromToken,
      loadCurrentUser,
    }),
    [state, roleNames, isAdmin, isCustomer, login, register, logout, setAuthFromToken, loadCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
