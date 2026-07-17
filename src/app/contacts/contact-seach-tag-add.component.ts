import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactSearchTag } from '../models/contact-detail.model';
import { ApiService } from '../services/api.service';

@Component({
  standalone: true,
  selector: 'app-contact-search-tag-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-seach-tag-add.component.html',
  styleUrls: ['./contact-seach-tag-add.component.css']
})
export class ContactSearchTagAddComponent implements OnInit, OnChanges {
  private hostElement = inject(ElementRef<HTMLElement>);
  private readonly initialSuggestionDelayMs = 700;
  private warmupTimerId: number | null = null;

  @Input() contactId = 0;
  @Input() tags: ContactSearchTag[] = [];
  @Output() tagsChange = new EventEmitter<ContactSearchTag[]>();

  availableSearchTags: string[] = [];
  entryText = '';
  suggestionWarning = '';
  suggestionsOpen = false;
  highlightedSuggestionIndex = -1;
  loadingSuggestions = false;
  hasLoadedSuggestions = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.scheduleSuggestionWarmup();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tags']) {
      this.ensureSuggestionsIncludeCurrentTags();
    }
  }

  get activeTags(): Array<{ index: number; text: string }> {
    return this.tags
      .map((tag, index) => ({
        index,
        text: (tag.tagText ?? '').trim(),
        isActive: tag.isActive
      }))
      .filter(tag => tag.isActive && tag.text.length > 0)
      .map(tag => ({ index: tag.index, text: tag.text }));
  }

  get filteredSuggestions(): string[] {
    const query = this.entryText.trim().toLowerCase();
    const activeTagKeys = new Set(
      this.activeTags.map(tag => tag.text.toLowerCase())
    );

    return this.availableSearchTags.filter(tag => {
      const normalized = tag.toLowerCase();
      if (activeTagKeys.has(normalized)) {
        return false;
      }

      return query.length === 0 || normalized.includes(query);
    });
  }

  get activeDescendantId(): string | null {
    if (!this.suggestionsOpen || this.highlightedSuggestionIndex < 0 || this.highlightedSuggestionIndex >= this.filteredSuggestions.length) {
      return null;
    }

    return this.getSuggestionId(this.highlightedSuggestionIndex);
  }

  addTag(): void {
    const value = this.entryText.trim();
    if (!value) {
      return;
    }

    const existingActive = this.tags.find(
      tag => tag.isActive && (tag.tagText ?? '').trim().toLowerCase() === value.toLowerCase()
    );
    if (existingActive) {
      this.entryText = '';
      return;
    }

    const now = new Date().toISOString();
    const existingInactiveIndex = this.tags.findIndex(
      tag => !tag.isActive && (tag.tagText ?? '').trim().toLowerCase() === value.toLowerCase()
    );

    let updatedTags: ContactSearchTag[];
    if (existingInactiveIndex >= 0) {
      updatedTags = this.tags.map((tag, index) => {
        if (index !== existingInactiveIndex) {
          return tag;
        }

        return {
          ...tag,
          isActive: true,
          tagText: value,
          modifiedAt: now
        };
      });
    } else {
      const newTag: ContactSearchTag = {
        id: 0,
        contactId: this.contactId > 0 ? this.contactId : 0,
        tagText: value,
        isActive: true,
        createdAt: now,
        modifiedAt: now
      };
      updatedTags = [...this.tags, newTag];
    }

    this.tagsChange.emit(updatedTags);
    this.addSuggestionIfMissing(value);
    this.entryText = '';
  }

  clearEntryText(): void {
    this.entryText = '';
    this.suggestionsOpen = true;
    this.highlightedSuggestionIndex = -1;
  }

  openSuggestions(): void {
    this.suggestionsOpen = true;
    this.highlightedSuggestionIndex = -1;

    if (!this.hasLoadedSuggestions && !this.loadingSuggestions) {
      void this.loadAvailableSearchTags();
    }
  }

  handleInputKeydown(event: KeyboardEvent): void {
    const suggestions = this.filteredSuggestions;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.suggestionsOpen) {
        this.suggestionsOpen = true;
      }

      if (suggestions.length === 0) {
        this.highlightedSuggestionIndex = -1;
        return;
      }

      this.highlightedSuggestionIndex = (this.highlightedSuggestionIndex + 1 + suggestions.length) % suggestions.length;
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.suggestionsOpen) {
        this.suggestionsOpen = true;
      }

      if (suggestions.length === 0) {
        this.highlightedSuggestionIndex = -1;
        return;
      }

      this.highlightedSuggestionIndex = this.highlightedSuggestionIndex <= 0
        ? suggestions.length - 1
        : this.highlightedSuggestionIndex - 1;
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.suggestionsOpen && this.highlightedSuggestionIndex >= 0 && this.highlightedSuggestionIndex < suggestions.length) {
        this.selectSuggestion(suggestions[this.highlightedSuggestionIndex]);
        return;
      }

      this.addTag();
      return;
    }

    if (event.key === 'Escape') {
      this.suggestionsOpen = false;
      this.highlightedSuggestionIndex = -1;
    }
  }

  handleFocusOut(): void {
    queueMicrotask(() => {
      const activeElement = document.activeElement;
      if (!activeElement || !this.hostElement.nativeElement.contains(activeElement)) {
        this.suggestionsOpen = false;
        this.highlightedSuggestionIndex = -1;
      }
    });
  }

  selectSuggestion(tag: string): void {
    this.entryText = tag;
    this.suggestionsOpen = false;
    this.highlightedSuggestionIndex = -1;
  }

  isSuggestionHighlighted(index: number): boolean {
    return this.highlightedSuggestionIndex === index;
  }

  removeTagAt(index: number): void {
    if (index < 0 || index >= this.tags.length) {
      return;
    }

    const now = new Date().toISOString();
    const updatedTags = this.tags.map((tag, tagIndex) => {
      if (tagIndex !== index) {
        return tag;
      }

      return {
        ...tag,
        isActive: false,
        modifiedAt: now
      };
    });

    this.tagsChange.emit(updatedTags);
  }

  private async loadAvailableSearchTags(): Promise<void> {
    this.loadingSuggestions = true;

    try {
      const tags = await this.api.listSearchTags();
      this.availableSearchTags = tags;
      this.suggestionWarning = '';
      this.hasLoadedSuggestions = true;
      this.ensureSuggestionsIncludeCurrentTags();
    } catch {
      this.availableSearchTags = [];
      this.suggestionWarning = 'Search tag suggestions are currently unavailable. You can still type a new tag.';
      this.hasLoadedSuggestions = false;
      this.ensureSuggestionsIncludeCurrentTags();
    } finally {
      this.loadingSuggestions = false;
    }
  }

  private scheduleSuggestionWarmup(): void {
    if (this.warmupTimerId !== null) {
      window.clearTimeout(this.warmupTimerId);
    }

    this.warmupTimerId = window.setTimeout(() => {
      this.warmupTimerId = null;
      if (!this.hasLoadedSuggestions && !this.loadingSuggestions) {
        void this.loadAvailableSearchTags();
      }
    }, this.initialSuggestionDelayMs);
  }

  private ensureSuggestionsIncludeCurrentTags(): void {
    const allTagTexts = [
      ...this.availableSearchTags,
      ...this.tags.map(tag => (tag.tagText ?? '').trim()).filter(tagText => tagText.length > 0)
    ];

    const seen = new Set<string>();
    this.availableSearchTags = allTagTexts
      .filter(tagText => {
        const key = tagText.toLowerCase();
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }

  private addSuggestionIfMissing(value: string): void {
    const exists = this.availableSearchTags.some(tag => tag.toLowerCase() === value.toLowerCase());
    if (!exists) {
      this.availableSearchTags = [...this.availableSearchTags, value].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
    }
  }

  private getSuggestionId(index: number): string {
    return `contact-search-tag-option-${index}`;
  }
}
