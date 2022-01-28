import React from 'react'
import ReactDOM from 'react-dom'
import { DialogDemo, DialogOpener } from './RadixDialog'
import EasyModal from '../src/index'

const App = () => {
  return (
    <EasyModal.ModalProvider>
      <DialogOpener />
      <DialogDemo />
    </EasyModal.ModalProvider>
  )
}

const el = document.getElementById('root')
el && ReactDOM.render(<App />, el)
