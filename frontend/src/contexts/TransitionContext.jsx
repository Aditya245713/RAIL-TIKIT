import React, { createContext, useContext, useState } from 'react'

const TransitionContext = createContext()

export const useTransition = () => {
  const context = useContext(TransitionContext)
  if (!context) {
    throw new Error('useTransition must be used within a TransitionProvider')
  }
  return context
}

export const TransitionProvider = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionMessage, setTransitionMessage] = useState('')

  const startTransition = (message = 'Loading...') => {
    setTransitionMessage(message)
    setIsTransitioning(true)
  }

  const endTransition = () => {
    setIsTransitioning(false)
    setTransitionMessage('')
  }

  const value = {
    isTransitioning,
    transitionMessage,
    startTransition,
    endTransition
  }

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  )
}

export default TransitionContext
