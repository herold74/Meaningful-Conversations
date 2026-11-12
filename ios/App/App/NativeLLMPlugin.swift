import Foundation
import Capacitor

#if canImport(FoundationModels)
import FoundationModels
#endif

@objc(NativeLLMPlugin)
public class NativeLLMPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeLLMPlugin"
    public let jsName = "NativeLLM"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "availability", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generate", returnType: CAPPluginReturnPromise)
    ]

    @objc func availability(_ call: CAPPluginCall) {
        let language = call.getString("language") ?? "de"
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            let model = SystemLanguageModel.default
            let locale = Locale(identifier: language)
            let languageSupported = model.supportsLocale(locale)
            let modelReady: Bool
            switch model.availability {
            case .available:
                modelReady = true
            default:
                modelReady = false
            }
            let ready = modelReady && languageSupported
            call.resolve([
                "available": ready,
                "reason": ready ? "available" : "unavailable"
            ])
            return
        }
        #endif
        call.resolve(["available": false, "reason": "unsupported"])
    }

    @objc func generate(_ call: CAPPluginCall) {
        let instructions = call.getString("instructions") ?? ""
        let prompt = call.getString("prompt") ?? ""
        let language = call.getString("language") ?? "de"
        #if canImport(FoundationModels)
        if #available(iOS 26.0, *) {
            Task {
                do {
                    let model = SystemLanguageModel.default
                    switch model.availability {
                    case .available:
                        break
                    default:
                        call.reject("On-device model is not available")
                        return
                    }
                    let session = LanguageModelSession(instructions: instructions)
                    let response = try await session.respond(to: prompt)
                    call.resolve(["text": response.content, "language": language])
                } catch {
                    call.reject("On-device generation failed: \(error.localizedDescription)")
                }
            }
            return
        }
        #endif
        call.reject("On-device model is not available")
    }
}
