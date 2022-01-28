import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react'
import { uniqueId } from './utils'

interface ModalState {
  visible?: boolean
  props?: Record<string, unknown>
  keepMounted?: boolean
}

interface ModalStore {
  [key: string]: ModalState
}

type Action<T extends string, P extends Record<string, unknown>> = {
  type: T
  payload: P
}

type ModalAction =
  | Action<'show', { modalId: string; props?: Record<string, unknown> }>
  | Action<'hide', { modalId: string }>
  | Action<'remove', { modalId: string }>

interface ModalHandler<Props = Record<string, unknown>> extends ModalState {
  show: (props?: Props) => void
  hide: () => void
  remove: () => void
}

const EasyModalContext = createContext<{
  store: ModalStore
  dispatch: React.Dispatch<ModalAction>
}>({
  store: {},
  dispatch: () => {
    throw new Error('Component must be wrapped with ModalProvider.')
  },
})

const EasyModalIdContext = createContext<string | null>(null)

const reducer = (state: ModalStore, action: ModalAction): ModalStore => {
  switch (action.type) {
    case 'show': {
      const { modalId, props } = action.payload
      return {
        ...state,
        [modalId]: {
          ...state[modalId],
          props,
          visible: true,
        },
      }
    }

    case 'hide': {
      const { modalId } = action.payload
      return {
        ...state,
        [modalId]: {
          ...state[modalId],
          visible: false,
        },
      }
    }

    case 'remove': {
      const { modalId } = action.payload
      const newState = { ...state }
      delete newState[modalId]
      return newState
    }

    default:
      return state
  }
}

const ModalProvider: React.FC = ({ children }) => {
  const [store, dispatch] = useReducer(reducer, {})

  return (
    <EasyModalContext.Provider value={{ store, dispatch }}>
      {children}
    </EasyModalContext.Provider>
  )
}

const ModalRegistry = new WeakMap<React.FC<unknown>, string>()

function useModal(): ModalHandler
function useModal<T extends React.FC<unknown>>(modal: T): ModalHandler
function useModal(modal?: unknown): ModalHandler {
  let modalId: string | null = null

  const contextModalId = useContext(EasyModalIdContext)
  const { store, dispatch } = useContext(EasyModalContext)

  if (!modal) {
    modalId = contextModalId
  } else {
    modalId = ModalRegistry.get(modal as React.FC<unknown>) ?? null
  }

  if (modalId == null) {
    throw new Error('Component must be wrapped with EasyModal.create.')
  }

  const modalState = store[modalId]

  const show = useCallback(
    (props?: Record<string, unknown>) => {
      if (!modalId) return
      dispatch({ type: 'show', payload: { modalId, props } })
    },
    [dispatch, modalId]
  )

  const hide = useCallback(() => {
    if (!modalId) return
    dispatch({ type: 'hide', payload: { modalId } })
  }, [dispatch, modalId])

  const remove = useCallback(() => {
    if (!modalId) return
    dispatch({ type: 'remove', payload: { modalId } })
  }, [dispatch, modalId])

  return useMemo(() => {
    return {
      show,
      hide,
      remove,
      ...modalState,
    }
  }, [hide, modalState, remove, show])
}

const create = <P extends Record<string, unknown>>(
  Component: React.FC<P>
): React.FC<P> => {
  const modalId = uniqueId()

  const WrappedComponent = (props: P) => {
    const { store } = useContext(EasyModalContext)

    const modalState = store[modalId]

    if (!modalState) return null

    return (
      <EasyModalIdContext.Provider value={modalId}>
        <Component {...props} />
      </EasyModalIdContext.Provider>
    )
  }

  ModalRegistry.set(WrappedComponent, modalId)

  return WrappedComponent
}

export default { create, ModalProvider, useModal }
export { useModal }
