// This component lets the user save a personal note about the savings goal.

import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Reflection as ReflectionModel } from '../../../models/challenge';
import { Savings } from '../../../services/savings';

@Component({
  selector: 'app-reflection',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './reflection.html',
  styleUrl: './reflection.css'
})
export class Reflection {
  // This required input receives the selected challenge ID from the parent.
  readonly challengeId = input.required<string>();

  // Savings service provides reflection data and saving functions.
  private readonly savingsService = inject(Savings);

  // This signal stores the text currently typed by the user.
  readonly reflectionText = signal('');

  // This signal controls the short confirmation message.
  readonly showSuccessMessage = signal(false);

  // This getter returns the selected challenge after the parent provides challengeId.
  get challenge() {
    return this.savingsService.getChallengeById(this.challengeId());
  }

  // This getter returns calculated statistics for the selected challenge.
  get stats() {
    return this.savingsService.getStatsByChallengeId(this.challengeId());
  }

  // This getter returns the saved reflection for the selected challenge.
  get savedReflection() {
    return this.savingsService.getReflectionByChallengeId(this.challengeId());
  }

  // This computed signal returns true when the user has saved reflection text.
  readonly hasReflection = computed(() => Boolean(this.savedReflection()?.text.trim()));

  constructor() {
    // This effect loads the saved reflection text when data becomes available.
    effect(() => {
      const existingReflection = this.savedReflection();

      // Update the text field only when a saved reflection exists.
      if (existingReflection) {
        this.reflectionText.set(existingReflection.text);
      }
    });
  }

  // This function updates the reflection text when the textarea value changes.
  updateReflectionText(value: string): void {
    this.reflectionText.set(value);
  }

  // This function validates and saves the reflection text.
  saveReflection(): void {
    const text = this.reflectionText().trim();

    // Stop when the user has not entered reflection text.
    if (!text) {
      alert('Please write a short reflection before saving.');
      return;
    }

    const reflection: ReflectionModel = {
      // Keep the existing ID when the user updates the reflection.
      id: this.savedReflection()?.id ?? crypto.randomUUID(),

      challengeId: this.challengeId(),
      text,

      // This records the latest time the reflection was saved.
      updatedAt: new Date().toISOString()
    };

    // This function saves or updates the reflection through the service.
    this.savingsService.saveReflection(reflection);

    // This function shows a confirmation message after saving.
    this.showSuccessMessage.set(true);

    // This function hides the confirmation message after three seconds.
    window.setTimeout(() => {
      this.showSuccessMessage.set(false);
    }, 3000);
  }

  // This function clears the text field but does not delete saved data yet.
  clearDraft(): void {
    this.reflectionText.set('');
  }
}