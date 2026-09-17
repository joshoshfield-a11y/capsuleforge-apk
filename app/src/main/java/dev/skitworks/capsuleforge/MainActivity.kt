package dev.skitworks.capsuleforge

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import java.io.File

class MainActivity : ComponentActivity() {

    private var fileCallback: ValueCallback<Array<Uri>>? = null

    // Without onShowFileChooser, <input type="file"> silently does nothing —
    // the most common "app is dead on my phone" bug in WebView shells.
    private val filePicker =
        registerForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
            fileCallback?.onReceiveValue(uris.toTypedArray())
            fileCallback = null
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val web = WebView(this)
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true        // brand persistence (localStorage)
        web.settings.allowFileAccess = true
        web.webViewClient = WebViewClient()
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                fileCallback = callback
                filePicker.launch(arrayOf("image/*"))
                return true
            }
        }
        // WebView ignores anchor-download clicks on data:/blob: URLs — expose a
        // native save bridge that studio.js feature-detects (web builds unaffected).
        web.addJavascriptInterface(Bridge(), "AndroidBridge")
        web.loadUrl("file:///android_asset/www/index.html")
        setContentView(web)
    }

    inner class Bridge {
        @JavascriptInterface
        fun savePNG(name: String, dataUrl: String) {
            try {
                val bytes = Base64.decode(dataUrl.substringAfter(","), Base64.DEFAULT)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val values = ContentValues().apply {
                        put(MediaStore.Images.Media.DISPLAY_NAME, name)
                        put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                        put(MediaStore.Images.Media.RELATIVE_PATH,
                            Environment.DIRECTORY_PICTURES + "/CapsuleForge")
                    }
                    val uri = contentResolver.insert(
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                    contentResolver.openOutputStream(uri!!).use { it?.write(bytes) }
                    toast("Saved to Pictures/CapsuleForge/$name")
                } else {
                    val dir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
                    val f = File(dir, name)
                    f.writeBytes(bytes)
                    toast("Saved to ${f.absolutePath}")
                }
            } catch (e: Exception) {
                toast("Save failed: ${e.message}")
            }
        }

        private fun toast(msg: String) {
            runOnUiThread { Toast.makeText(this@MainActivity, msg, Toast.LENGTH_LONG).show() }
        }
    }
}
