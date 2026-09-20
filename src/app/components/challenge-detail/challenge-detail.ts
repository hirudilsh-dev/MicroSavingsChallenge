// This component displays the main page for one savings challenge.

// This component displays the main page for one savings challenge.

import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckIn } from './check-in/check-in';
import { Savings } from '../../services/savings';
import { Dashboard } from './dashboard/dashboard';
import { Reflection } from './reflection/reflection';

type ChallengeTab = 'check-in' | 'dashboard' | 'reflection';

@Component({
  selector: 'app-challenge-detail',
  imports: [DecimalPipe, CheckIn, Dashboard, Reflection],
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
}