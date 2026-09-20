// This component displays the main page for one savings challenge.

// This component displays the main page for one savings challenge.

import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckIn } from './check-in/check-in';
import { Savings } from '../../services/savings';
import { Dashboard } from './dashboard/dashboard';
import { Reflection } from './reflection/reflection';
import { FormsModule } from '@angular/forms';

type ChallengeTab = 'check-in' | 'dashboard' | 'reflection';

@Component({
  selector: 'app-challenge-detail',
  imports: [DecimalPipe, FormsModule, CheckIn, Dashboard, Reflection],
  templateUrl: './challenge-detail.html',
  styleUrl: './challenge-detail.css'
})
export class ChallengeDetail {
  // Router is used to move the user back to the home page.
  private readonly router = inject(Router);

  // ActivatedRoute provides the ID from the current URL.
  private readonly activatedRoute = inject(ActivatedRoute);

  // Savings service provides selected challenge data.
  private readonly savingsService = inject(Savings);

  // This signal stores the tab currently selected by the user.
  readonly activeTab = signal<ChallengeTab>('check-in');

  // This signal controls whether the edit form is visible.
  readonly isEditing = signal(false);

  // These fields hold editable challenge values.
  editName = '';
  editAmount: number | null = null;
  editPeriod: 'daily' | 'weekly' = 'daily';
  editStartDate = '';
  editTargetDays: number | null = null;
  editTargetAmount: number | null = null;
  editCurrency = 'LKR';

  // This value reads the challenge ID from the URL one time.
  readonly challengeId = this.activatedRoute.snapshot.paramMap.get('id') ?? '';

  // This computed signal returns the challenge matching the URL ID.
  readonly challenge = this.savingsService.getChallengeById(this.challengeId);

  // This computed signal returns dashboard statistics for this challenge.
  readonly stats = this.savingsService.getStatsByChallengeId(this.challengeId);

  // This computed signal calculates goal progress as a safe percentage.
  readonly goalProgress = computed(() => {
    const challenge = this.challenge();
    const totalSaved = this.stats().totalSaved;

    // Return zero when the challenge has no target amount.
    if (!challenge?.targetAmount || challenge.targetAmount <= 0) {
      return 0;
    }

    // Limit the percentage to 100 for the visual progress bar.
    return Math.min((totalSaved / challenge.targetAmount) * 100, 100);
  });

  // This function changes the visible content tab.
  selectTab(tab: ChallengeTab): void {
    this.activeTab.set(tab);
  }

  // This function returns the user to the home page.
  goHome(): void {
    this.router.navigate(['/']);
  }

  // This function opens the challenge setup page to create another challenge.
  createAnotherChallenge(): void {
    this.router.navigate(['/setup']);
  }

  // This function asks for confirmation and deletes the current challenge.
  deleteCurrentChallenge(): void {
    const selectedChallenge = this.challenge();

    // Stop when the selected challenge does not exist.
    if (!selectedChallenge) {
      return;
    }

    // Ask the user to confirm this permanent action.
    const shouldDelete = window.confirm(
      `Delete "${selectedChallenge.name}"?\n\n` +
      'This will permanently remove the challenge, its check-ins, and its reflection.'
    );

    // Stop when the user cancels the confirmation dialog.
    if (!shouldDelete) {
      return;
    }

    // Delete the selected challenge through the savings service.
    this.savingsService.deleteChallenge(selectedChallenge.id);

    // Return the user to the home page after deletion.
    this.router.navigate(['/']);
  }

  // This function opens the edit form and loads current challenge values.
  openEditForm(): void {
    const selectedChallenge = this.challenge();

    // Stop when the selected challenge does not exist.
    if (!selectedChallenge) {
      return;
    }

    // Load existing values into the editable form fields.
    this.editName = selectedChallenge.name;
    this.editAmount = selectedChallenge.amount;
    this.editPeriod = selectedChallenge.period;
    this.editStartDate = selectedChallenge.startDate;
    this.editTargetDays = selectedChallenge.targetDays ?? null;
    this.editTargetAmount = selectedChallenge.targetAmount ?? null;
    this.editCurrency = selectedChallenge.currency;

    // Show the edit form.
    this.isEditing.set(true);
  }

  // This function closes the edit form without changing challenge data.
  cancelEdit(): void {
    this.isEditing.set(false);
  }

  // This function validates and saves the edited challenge values.
  saveChallengeChanges(): void {
    const selectedChallenge = this.challenge();

    // Stop when the challenge does not exist.
    if (!selectedChallenge) {
      return;
    }

    // Stop when required form values are invalid.
    if (!this.editName.trim() || !this.editAmount || this.editAmount <= 0) {
      alert('Please enter a valid challenge name and saving amount.');
      return;
    }

    // Create a new object instead of changing the old challenge directly.
    const updatedChallenge = {
      ...selectedChallenge,
      name: this.editName.trim(),
      amount: this.editAmount,
      period: this.editPeriod,
      startDate: this.editStartDate,
      targetDays:
        this.editTargetDays && this.editTargetDays > 0
          ? this.editTargetDays
          : undefined,
      targetAmount:
        this.editTargetAmount && this.editTargetAmount > 0
          ? this.editTargetAmount
          : undefined,
      currency: this.editCurrency
    };

    // Save the updated challenge through the savings service.
    this.savingsService.updateChallenge(updatedChallenge);

    // Close the edit form after successful save.
    this.isEditing.set(false);
  }
}