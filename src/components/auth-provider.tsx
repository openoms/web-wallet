import React, { useMemo, useState, ReactNode, useEffect, useCallback } from "react"
import { useErrorHandler } from "react-error-boundary"

import { GaloyClient, GaloyProvider, postRequest } from "@galoymoney/client"

import { createClient, useAppDispatcher, useRequest } from "store/index"
import { AuthContext } from "store/use-auth-context"
import axios from "axios"

import config from "store/config"
import storage from "store/local-storage"

const galoySessionName = "galoy-session"

const clearSession = () => {
  storage.delete(galoySessionName)
}

const persistSession = (session: AuthSession) => {
  if (session) {
    storage.set(galoySessionName, JSON.stringify(session))
  } else {
    clearSession()
  }
}

const getPersistedSession = (sessionData?: {
  galoyJwtToken?: string
  identity?: AuthIdentity
}): AuthSession => {
  if (sessionData?.galoyJwtToken && sessionData?.identity) {
    const { galoyJwtToken, identity } = sessionData
    return { galoyJwtToken, identity }
  }
  if (config.isBrowser) {
    const session = storage.get(galoySessionName)

    if (session) {
      // TODO: verify session shape
      return JSON.parse(session)
    }
  }
  return null
}

type FCT = React.FC<{
  children: ReactNode
  galoyClient?: GaloyClient<unknown>
  galoyJwtToken?: string
  authIdentity?: AuthIdentity
}>

export const AuthProvider: FCT = ({
  children,
  galoyClient,
  galoyJwtToken,
  authIdentity,
}) => {
  const request = useRequest()
  const dispatch = useAppDispatcher()
  const [authSession, setAuthSession] = useState<AuthSession>(() =>
    getPersistedSession({ galoyJwtToken, identity: authIdentity }),
  )

  const setAuth = useCallback((session: AuthSession) => {
    if (session) {
      persistSession(session)
    } else {
      clearSession()
    }

    setAuthSession(session)
  }, [])

  const syncSession = useCallback(async () => {
    const resp = await axios.post(config.galoyAuthEndpoint, {}, { withCredentials: true })
    if (!resp.data.authToken) {
      throw new Error("Invalid auth token respose")
    }
    const authToken = resp.data.authToken
    const session = await request.post(config.authEndpoint, { authToken })
    if (!session || !session.galoyJwtToken) {
      throw new Error("Invalid auth token respose")
    }
    setAuth(session.galoyJwtToken ? session : null)
    dispatch({ type: "kratos-login", authIdentity: session.identity })
  }, [dispatch, request, setAuth])

  useEffect(() => {
    const persistedSession = getPersistedSession()

    if (
      (authIdentity?.userId || persistedSession) &&
      persistedSession?.identity?.userId !== authIdentity?.userId
    ) {
      setAuth(null)
      document.location.href = "/logout"
    }
  }, [authIdentity?.userId, setAuth])

  const handleError = useErrorHandler()
  const client = useMemo(() => {
    // When server side rendering a client is already provided
    if (galoyClient) {
      return galoyClient
    }
    return createClient({
      authToken: authSession?.galoyJwtToken,
      onError: ({ graphQLErrors, networkError }) => {
        if (graphQLErrors) {
          console.debug("[GraphQL errors]:", graphQLErrors)
        }
        if (networkError) {
          console.debug("[Network error]:", networkError)
          if (
            "result" in networkError &&
            networkError.result.errors?.[0]?.code === "INVALID_AUTHENTICATION"
          ) {
            postRequest(authSession?.galoyJwtToken)("/api/logout").then(() => {
              setAuth(null)
            })
          } else {
            handleError(networkError)
          }
        }
      },
    })
  }, [galoyClient, authSession?.galoyJwtToken, setAuth, handleError])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(authSession?.galoyJwtToken),
        galoyJwtToken: authSession?.galoyJwtToken,
        authIdentity: authSession?.identity,
        setAuthSession: setAuth,
        syncSession,
      }}
    >
      <GaloyProvider client={client}>{children}</GaloyProvider>
    </AuthContext.Provider>
  )
}

export default AuthProvider
