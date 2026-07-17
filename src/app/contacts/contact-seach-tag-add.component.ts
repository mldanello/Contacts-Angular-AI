import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
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
  @Input() contactId = 0;
  @Input() tags: ContactSearchTag[] = [];
  @Output() tagsChange = new EventEmitter<ContactSearchTag[]>();

  availableSearchTags: string[] = [];
  entryText = '';
  suggestionWarning = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    void this.loadAvailableSearchTags();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contactId'] && !changes['contactId'].firstChange) {
      void this.loadAvailableSearchTags();
      return;
    }

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
    try {
      const tags = await this.api.listSearchTags();
      this.availableSearchTags = tags;
      this.suggestionWarning = '';
      this.ensureSuggestionsIncludeCurrentTags();
    } catch {
      this.availableSearchTags = [];
      this.suggestionWarning = 'Search tag suggestions are currently unavailable. You can still type a new tag.';
      this.ensureSuggestionsIncludeCurrentTags();
    }
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
}
