#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// This file registers the NativeTTSPlugin with Capacitor's plugin registry.
// The actual implementation is in NativeTTSPlugin.swift.

CAP_PLUGIN(NativeTTSPlugin, "NativeTTS",
    CAP_PLUGIN_METHOD(getVoices, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(speak, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stop, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(pause, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(resume, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isSpeaking, CAPPluginReturnPromise);
)
