/// <reference path="../typings/open/open.d.ts" />
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var open = require('open');
var utils = require('./utils');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    validateConfig();
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "code-bing" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('codebing.search', function () {
        // The code you place here will be executed every time your command is executed
        // Get the active editor
        var editor = vscode.window.activeTextEditor;
        var text = "";
        if (editor) {
            // Get the selected text
            var selection = editor.selection;
            text = editor.document.getText(selection);
        }
        var config = vscode.workspace.getConfiguration("codebing");
        if (!utils.isNullOrEmpty(text) && config.get("noInputBoxIfTextSelected")) {
            searchFor(text);
        }
        else {
            // Show an input box where the user can enter the text he want to search for
            // In order to do so, setup some options. 
            var options = {
                prompt: "Enter provider code followed by query",
                value: text,
                placeHolder: "Query" // <- An optional string to show as place holder in the input box to guide the user what to type.
            };
            // Open the input box. If the user hits enter, 'searchfor' is invoked.
            vscode.window.showInputBox(options).then(searchFor);
        }
    });
    context.subscriptions.push(disposable);
    // check configuration every time the user changes it.
    disposable = vscode.workspace.onDidChangeConfiguration(validateConfig);
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// Returns the url of the search provider with the query.
//
// @return the search url with query
function getSearchUrl(query) {
    // Get config stuff
    var config = vscode.workspace.getConfiguration("codebing");
    var searchProviders = config.get("searchProviders");
    var useDefaultOnly = config.get("useDefaultProviderOnly");
    var defaultProvider = config.get("defaultProvider");
    var providerID = query.split(' ', 1)[0];
    // Backwards compatibility with old config format
    var oldSearchProvider = config.get("searchprovider");
    if (oldSearchProvider != null) {
        defaultProvider = oldSearchProvider;
        showConfigWarning("codebing.searchprovider is depricated!");
    }
    // Select the search provider
    var selectedProvider = "";
    var isDefault = false;
    // Return default only if specified in config.
    if (useDefaultOnly) {
        isDefault = true;
    }
    else {
        var searchProvider = searchProviders[providerID];
        if (searchProvider) {
            selectedProvider = searchProvider;
        }
        else {
            isDefault = true;
        }
    }
    if (isDefault) {
        // if default resolve defaultProvider
        selectedProvider = searchProviders[defaultProvider];
        if (!selectedProvider) {
            selectedProvider = defaultProvider;
        }
    }
    if (!isValidProviderUrl(selectedProvider, false)) {
        showConfigWarning("Selected provider is not valid: '" + selectedProvider + "'");
    }
    var searchUrl = selectedProvider;
    var q = "";
    if (!isDefault) {
        // If not using default then strip away the provider ID from query
        q = query.substr(providerID.length + 1);
    }
    else {
        q = query;
    }
    // Insert query and strip out invalid characters.
    searchUrl = searchUrl.replace("{query}", q).replace(/[\r\n]/g, "");
    return searchUrl;
}
function searchFor(query) {
    if (!query) {
        return;
    }
    open(getSearchUrl(query));
}
// Validate config to ensure all urls work etc.
function validateConfig() {
    var config = vscode.workspace.getConfiguration("codebing");
    var searchProviders = config.get("searchProviders");
    var defaultProvider = config.get("defaultProvider");
    var invalidProviders = [];
    // Validate searchProviders
    for (var key in searchProviders) {
        if (searchProviders.hasOwnProperty(key)) {
            if (!isValidProviderUrl(searchProviders[key])) {
                invalidProviders.push(key);
            }
        }
    }
    // Validate defaultProvider
    if (!isValidProviderUrl(defaultProvider, true)
        && !isValidProviderUrl(searchProviders[defaultProvider])) {
        invalidProviders.push("defaultProvider: '" + defaultProvider + "'");
    }
    if ((invalidProviders != null) && (invalidProviders.length > 0)) {
        var msg = "Invalid searchProviders: ";
        invalidProviders.forEach(function (provider) {
            msg += "'" + provider + "', ";
        });
        showConfigWarning(msg.substr(0, msg.length - 2));
    }
}
function isValidProviderUrl(url, regexValidation) {
    if (regexValidation === void 0) { regexValidation = true; }
    var isValid = ((url != null) && (url.indexOf("{query}") >= 0));
    if (regexValidation && isValid) {
        var regex = /^http(s)?:\/\/(www\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;
        isValid = regex.test(url.replace("{query}", ""));
    }
    return isValid;
}
function showConfigWarning(warning) {
    ;
    var openGlobalSettings = { title: "Open global settings", cmd: "workbench.action.openGlobalSettings" };
    var openWorkspaceSettings = { title: "Open workspace settings", cmd: "workbench.action.openWorkspaceSettings" };
    // Only show "Open workspace settings" if a folder is open
    (vscode.workspace.rootPath == undefined
        ? vscode.window.showWarningMessage(warning, openGlobalSettings)
        : vscode.window.showWarningMessage(warning, openGlobalSettings, openWorkspaceSettings))
        .then(function (c) {
        if (c)
            vscode.commands.executeCommand(c.cmd);
    });
}
//# sourceMappingURL=extension.js.map