// Define utility functions
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;

// Export module properties
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// Convert module to CommonJS format
var __toCommonJS = (mod) => {
  return mod;
};

// Declare main exports
var main_exports = {};
__export(main_exports, {
  default: () => CheckboxSoundeffect
});
module.exports = __toCommonJS(main_exports);

// Import Obsidian API
var import_obsidian = require("obsidian");

// Define default settings
var DEFAULT_SETTINGS = {
  audioURL: "https://cdn.discordapp.com/attachments/718508936185118810/1137813613873209425/success.mp3",
  inlineAudioURL: "https://cdn.discordapp.com/attachments/718508936185118810/1137813613873209425/success.mp3", // New field for inline audio URL
  checkboxVolume: 1.0, // Default volume for checkbox audio (0.0 to 1.0)
  inlineVolume: 1.0    // Default volume for inline audio (0.0 to 1.0)
};

// Main plugin class
var CheckboxSoundeffect = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.previousContent = "";  // Renamed from oldcontent for consistency
    this.justSwitched = false;
  }

  async onload() {
    await this.loadSettings();
    this.audio = new Audio(this.settings.audioURL);
    this.inlineAudio = new Audio(this.settings.inlineAudioURL); // Initialize inlineAudio

    this.audio.volume = this.settings.checkboxVolume;
    this.inlineAudio.volume = this.settings.inlineVolume;

    const editor = this.getActiveMarkdownEditor();
    if (editor) {
      this.previousContent = editor.getValue(); // Renamed from oldcontent for consistency
    }

    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      this.justSwitched = true;
      const activeView2 = this.app.workspace.activeLeaf;
      if (!activeView2) return;
      const view2 = activeView2.view;
      if (!(view2 instanceof import_obsidian.MarkdownView)) return;
      const editor2 = view2.editor;
      this.previousContent = editor2.getValue(); // Renamed from oldcontent for consistency
    }));

    this.interval = window.setInterval(this.checkCheckboxes.bind(this), 100);
    this.addSettingTab(new CheckboxSoundeffectSettings(this.app, this));
  }


  setCheckboxVolume(volume) {
    this.audio.volume = volume;
  }

  setInlineVolume(volume) {
    this.inlineAudio.volume = volume;
  }



  getActiveMarkdownEditor() {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf) return null;
    const activeView = activeLeaf.view;
    if (!(activeView instanceof import_obsidian.MarkdownView)) return null;
    return activeView.editor;
  }

  checkCheckboxes() {
    if (this.justSwitched) {
      this.justSwitched = false;
      return;
    }

    const editor = this.getActiveMarkdownEditor();
    if (!editor) return;
    const content = editor.getValue();
    const checkboxCheckedRegex = /- \[[xX]\] /g;
    const checkboxUncheckedRegex = /- \[ \] /g;
    const customFalseRegex = /([\w_]+)\s*::\s*false/g;
    const customTrueRegex = /([\w_]+)\s*::\s*true/g;

    const oldCheckedMatches = (this.previousContent.match(checkboxCheckedRegex) || []).length;
    const newCheckedMatches = (content.match(checkboxCheckedRegex) || []).length;
    const oldUncheckedMatches = (this.previousContent.match(checkboxUncheckedRegex) || []).length;
    const newUncheckedMatches = (content.match(checkboxUncheckedRegex) || []).length;

    if (oldCheckedMatches < newCheckedMatches || oldUncheckedMatches > newUncheckedMatches) {
      this.audio.cloneNode(true).play();
    }

    const oldFalseMatches = Array.from(this.previousContent.matchAll(customFalseRegex));
    const newFalseMatches = Array.from(content.matchAll(customFalseRegex));
    const oldTrueMatches = Array.from(this.previousContent.matchAll(customTrueRegex));
    const newTrueMatches = Array.from(content.matchAll(customTrueRegex));

    if (oldFalseMatches.length > newFalseMatches.length && newTrueMatches.length > oldTrueMatches.length) {
      this.inlineAudio.cloneNode(true).play();
    }

    this.previousContent = content; // Renamed from oldcontent for consistency
  }

  onunload() {
    window.clearInterval(this.interval);
  }

  async loadSettings() {
    try {
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...(await this.loadData())
      };
      this.audio.volume = this.settings.checkboxVolume; // Update the audio volume when settings are loaded
      this.inlineAudio.volume = this.settings.inlineVolume; // Update the inline audio volume when settings are loaded
    } catch (error) {
      console.error("Failed to load settings:", error);
      this.settings = DEFAULT_SETTINGS;
    }
  }


  async saveSettings() {
    try {
      await this.saveData(this.settings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }

  setAudioURL(url) {
    this.audio.src = url;
  }

  setInlineAudioURL(url) {
    this.inlineAudio.src = url; // Set the source for inlineAudio
  }
};

// Plugin settings tab
var CheckboxSoundeffectSettings = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    let { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Settings for Checkbox Sound Effect Plugin" });

    new import_obsidian.Setting(containerEl).setName("Audio URL").setDesc("Enter the URL for the audio file you want to play.").addText((text) => text.setPlaceholder("Enter the audio URL here").setValue(this.plugin.settings.audioURL).onChange(async (value) => {
      this.plugin.settings.audioURL = value;
      this.plugin.setAudioURL(value);
      await this.plugin.saveSettings();
    }));

    new import_obsidian.Setting(containerEl)
      .setName("Inline Toggle Audio URL")
      .setDesc("Enter the URL for the audio file you want to play when toggling inline booleans.")
      .addText((text) => text
        .setPlaceholder("Enter the inline audio URL here")
        .setValue(this.plugin.settings.inlineAudioURL)
        .onChange(async (value) => {
          this.plugin.settings.inlineAudioURL = value;
          this.plugin.setInlineAudioURL(value);
          await this.plugin.saveSettings();
        })
      );

    new import_obsidian.Setting(containerEl)
      .setName("Checkbox Audio Volume")
      .setDesc("Set the volume for checkbox audio (0.0 to 1.0)")
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.checkboxVolume)
        .onChange(async (value) => {
          this.plugin.settings.checkboxVolume = value;
          this.plugin.setCheckboxVolume(value);
          await this.plugin.saveSettings();
        }));

    new import_obsidian.Setting(containerEl)
      .setName("Inline Toggle Audio Volume")
      .setDesc("Set the volume for inline toggle audio (0.0 to 1.0)")
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.inlineVolume)
        .onChange(async (value) => {
          this.plugin.settings.inlineVolume = value;
          this.plugin.setInlineVolume(value);
          await this.plugin.saveSettings();
        }));

  }
};
