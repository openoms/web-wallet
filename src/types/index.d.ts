type SelfServiceRegistrationFlow =
  import("@ory/kratos-client").SelfServiceRegistrationFlow
type KratosSession = import("@ory/kratos-client").Session
type SelfServiceLoginFlow = import("@ory/kratos-client").SelfServiceLoginFlow
type SelfServiceRecoveryFlow = import("@ory/kratos-client").SelfServiceRecoveryFlow
type SelfServiceSettingsFlow = import("@ory/kratos-client").SelfServiceSettingsFlow

// Galoy Client
type NormalizedCacheObject = import("@galoymoney/client").NormalizedCacheObject

type PaymentType = import("@galoymoney/client").PaymentType
type Network = import("@galoymoney/client").Network

type Transaction = import("@galoymoney/client").GaloyGQL.Transaction
type SettlementType = import("@galoymoney/client").GaloyGQL.SettlementVia["__typename"]
type IntraLedgerUpdate = import("@galoymoney/client").GaloyGQL.IntraLedgerUpdate
type LnUpdate = import("@galoymoney/client").GaloyGQL.LnUpdate
type OnChainUpdate = import("@galoymoney/client").GaloyGQL.OnChainUpdate

// Helpers
type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Server and state
type RoutePath = import("../server/routes").SupportedRoutes
type RouteInfo = Record<string, string | (() => JSX.Element | null)>

type AuthRoutePath = import("../server/routes").SupportedAuthRoutes

type KratosFlowData = {
  registrationData?: SelfServiceRegistrationFlow
  loginData?: SelfServiceLoginFlow
  recoveryData?: SelfServiceRecoveryFlow
  settingsData?: SelfServiceSettingsFlow
}

type HandleKratosResponse =
  | { redirect: true; redirectTo: string }
  | { redirect: false; flowData: KratosFlowData }

type AuthIdentity = {
  userId: string
  phoneNumber?: string
  emailAddress?: string
  firstName?: string
  lastName?: string
}

type GwwState = {
  key: number
  path: RoutePath | AuthRoutePath
  props?: Record<string, unknown>
  authIdentity?: AuthIdentity
  defaultLanguage?: string
  emailVerified?: boolean
  flowData?: KratosFlowData
}

type GwwAction = {
  type: "update" | "update-with-key" | "kratos-login"
  authIdentity?: AuthIdentity
  [payloadKey: string]: string | Record<string, string> | undefined
}

type GwwContextType = {
  state: GwwState
  dispatch: React.Dispatch<GwwAction>
}

type AuthSession = {
  galoyJwtToken: string
  identity: AuthIdentity
} | null

type AuthContextType = {
  isAuthenticated: boolean
  galoyJwtToken?: string
  authIdentity?: AuthIdentity
  setAuthSession: (session: AuthSession) => void
  syncSession: () => Promise<void>
}

type ServerRendererFunction = (path: RoutePath) => Promise<{
  GwwState: GwwState
  initialMarkup: string
  pageData: RouteInfo
}>

declare interface Window {
  __G_DATA: {
    GwwState: GwwState
    ssrData: NormalizedCacheObject
    GwwConfig: {
      walletName: string
      walletTheme: string
      supportEmail: string
      shareUri: string
      graphqlUri: string
      graphqlSubscriptionUri: string
      network: Network
      authEndpoint: string
      kratosFeatureFlag: boolean
      kratosBrowserUrl: string
      galoyAuthEndpoint: string
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initGeetest: (...args: any[]) => void
}

// Hooks

type UseAuthContextFunction = () => AuthContextType

type UseMyUpdates = {
  satsToUsd: ((sats: number) => number) | null
  usdToSats: ((usd: number) => number) | null
  currentBalance: number | null
  intraLedgerUpdate: Partial<IntraLedgerUpdate> | null
  lnUpdate: Partial<LnUpdate> | null
  onChainUpdate: Partial<OnChainUpdate> | null
}

type Currency = "USD" | "SATS"

type InvoiceInput = {
  view?: "destination" | "amount" | "confirm"
  currency: Currency

  // undefined in input is used to indicate their changing state
  amount?: number | ""
  destination?: string
  memo?: string

  satAmount?: number // from price conversion

  valid?: boolean // from parsing
  errorMessage?: string
  paymentType?: PaymentType

  sameNode?: boolean
  fixedAmount?: boolean // if the invoice has amount
  paymentRequest?: string // if payment is lightning
  address?: string // if payment is onchain
  recipientWalletId?: string // if payment is intraledger

  newDestination?: string // for scanned codes
}

// Components

type NoPropsFCT = React.FC<Record<string, never>>

type SendActionProps = InvoiceInput & {
  btcWalletId: string
  btcWalletBalance: number
  reset: () => void
}

type SendOnChainActionProps = SendActionProps & {
  address: string
  satAmount: number
}

type SendLnActionProps = SendActionProps & {
  paymentRequest: string
}

type SendLnNoAmountActionProps = SendLnActionProps & {
  satAmount: number
}

type SendIntraLedgerActionProps = SendActionProps & {
  recipientWalletId: string
  satAmount: number
}

type TransactionDetailProps = {
  tx: Transaction
  isReceive: boolean
  isPending: boolean
  description: string
  usdAmount: number
}
