const isBrowser = typeof window !== "undefined"

if (!isBrowser) {
  const requiredEnvVars = [
    "NODE_ENV",
    "SESSION_KEYS",
    "HOST",
    "PORT",
    "SUPPORT_EMAIL",
    "GRAPHQL_URI",
    "GRAPHQL_SUBSCRIPTION_URI",
    "AUTH_ENDPOINT",
    "AUTH_BASE_URL",
    "KRATOS_ENDPOINT",
  ]

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Missing env var: ${envVar}`)
    }
  })

  if (
    process.env.NETWORK &&
    !["mainnet", "testnet", "regtest"].includes(process.env.NETWORK)
  ) {
    throw new Error("Invalid NETWORK value")
  }
}

const networkMap = (graphqlUri: string): Network => {
  if (graphqlUri.match("mainnet")) {
    return "mainnet"
  }

  if (graphqlUri.match("testnet")) {
    return "testnet"
  }

  return "regtest"
}

const config = isBrowser
  ? {
      isBrowser,
      supportEmail: window.__G_DATA.GwwConfig.supportEmail,
      network: window.__G_DATA.GwwConfig.network,
      graphqlUri: window.__G_DATA.GwwConfig.graphqlUri,
      graphqlSubscriptionUri: window.__G_DATA.GwwConfig.graphqlSubscriptionUri,
      authEndpoint: window.__G_DATA.GwwConfig.authEndpoint,
      signupEmailEndpoint: window.__G_DATA.GwwConfig.signupEmailEndpoint,
      sessionKeys: "",
    }
  : {
      isDev: process.env.NODE_ENV !== "production",
      isBrowser,
      sessionKeys: process.env.SESSION_KEYS as string,
      host: process.env.HOST as string,
      port: Number(process.env.PORT),
      supportEmail: process.env.SUPPORT_EMAIL as string,
      network:
        (process.env.NETWORK as Network) ?? networkMap(process.env.GRAPHQL_URI as string),
      graphqlUri: process.env.GRAPHQL_URI as string,
      graphqlSubscriptionUri: process.env.GRAPHQL_SUBSCRIPTION_URI as string,

      authEndpoint: process.env.AUTH_ENDPOINT as string,
      signupEmailEndpoint: `${process.env.AUTH_BASE_URL as string}/signup/email`,
    }

export default config
