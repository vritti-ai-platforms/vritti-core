package com.anonymous.coreapp

import android.graphics.Color
import androidx.appcompat.app.AlertDialog
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import java.util.concurrent.atomic.AtomicBoolean

// Shows a Material 3 (Android 16) dialog via MaterialAlertDialogBuilder — the rounded/inset M3 shape RN's
// Alert.alert (AppCompat builder) can't produce. Resolves true on confirm, false on cancel/dismiss.
// Quantum's useConfirm routes here through a globalThis presenter the host installs on Android.
class MaterialDialogModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "MaterialDialog"

  @ReactMethod
  fun showDialog(options: ReadableMap, promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }

    val title = if (options.hasKey("title")) options.getString("title") else null
    val message = if (options.hasKey("message")) options.getString("message") else null
    val confirmLabel = (if (options.hasKey("confirmLabel")) options.getString("confirmLabel") else null) ?: "OK"
    val cancelLabel =
      if (options.hasKey("cancelLabel") && !options.isNull("cancelLabel")) options.getString("cancelLabel") else null
    val destructive = options.hasKey("destructive") && options.getBoolean("destructive")
    val isAlert = options.hasKey("alert") && options.getBoolean("alert")

    activity.runOnUiThread {
      val settled = AtomicBoolean(false)
      fun settle(value: Boolean) {
        if (settled.compareAndSet(false, true)) promise.resolve(value)
      }

      val builder = MaterialAlertDialogBuilder(activity)
        .setTitle(title)
        .setMessage(message)
        .setPositiveButton(confirmLabel) { _, _ -> settle(true) }
        .setOnCancelListener { settle(false) }

      // Single-button alerts omit the cancel action; confirms get one.
      if (!isAlert && cancelLabel != null) {
        builder.setNegativeButton(cancelLabel) { _, _ -> settle(false) }
      }

      val dialog = builder.create()
      // Destructive confirm → tint the primary button red (M3 has no built-in destructive button style).
      if (destructive) {
        dialog.setOnShowListener {
          dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(Color.parseColor("#EF4444"))
        }
      }
      dialog.show()
    }
  }
}
