package com.anonymous.coreapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

// Registers the MaterialDialog native module (New-Arch legacy-module interop makes NativeModules.MaterialDialog
// resolvable without codegen). Added to MainApplication's package list.
class MaterialDialogPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(MaterialDialogModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    emptyList()
}
