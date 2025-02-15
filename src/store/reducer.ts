const mainReducer = (state: GwwState, action: GwwAction): GwwState => {
  const { type, ...newState } = action

  switch (type) {
    case "update":
      return { ...state, ...newState }
    case "update-with-key":
      return { ...state, ...newState, key: Math.random() }
    case "kratos-login":
      return { ...state, authIdentity: newState.authIdentity }
    default:
      throw new Error("UNSUPPORTED_ACTION")
  }
}

export default mainReducer
