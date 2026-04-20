package com.nicoabad.synapse;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Chrome 83 WebView GPU process fails eglChooseConfig on this emulator,
        // making the WebView surface invisible even though JS/canvas run correctly.
        // LAYER_TYPE_SOFTWARE forces the WebView View to composite via software,
        // bypassing the EGL surface creation entirely.
        getBridge().getWebView().setLayerType(View.LAYER_TYPE_SOFTWARE, null);
    }
}
