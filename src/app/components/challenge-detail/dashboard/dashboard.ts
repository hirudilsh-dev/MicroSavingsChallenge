// This component displays statistics and recent activity for one challenge.

import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { CheckIn } from '../../../models/challenge';
import { Savings } from '../../../services/savings';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  // This required input receives the selected challenge ID from the parent.
  readonly challengeId = input.required<string>();

  // Savings service provides check-ins and calculated challenge statistics.
  private readonly savingsService = inject(Savings);

  // This getter returns the selected challenge after the parent provides challengeId.
  get challenge() {
    return this.savingsService.getChallengeById(this.challengeId());
  }

  // This getter returns statistics for the selected challenge.
  get stats() {
    return this.savingsService.getStatsByChallengeId(this.challengeId());
  }

  // This getter returns all check-ins for the selected challenge.
  get checkIns() {
    return this.savingsService.getCheckInsByChallengeId(this.challengeId());
  }

  // This computed signal returns only the five newest check-ins.
  readonly recentCheckIns = computed(() => this.checkIns().slice(0, 5));

  // This computed signal calculates target progress as a percentage.
  readonly targetProgress = computed(() => {
    const selectedChallenge = this.challenge();
    const totalSaved = this.stats().totalSaved;

    // Return zero when no target amount exists.
    if (!selectedChallenge?.targetAmount || selectedChallenge.targetAmount <= 0) {
      return 0;
    }

    // Limit progress to 100 percent for display.
    return Math.min((totalSaved / selectedChallenge.targetAmount) * 100, 100);
  });

  // This function returns a friendly label for a check-in record.
  getCheckInStatus(checkIn: CheckIn): string {
    return checkIn.saved ? 'Saved' : 'Not saved';
  }

  // This function returns the amount shown for one check-in.
  getCheckInAmount(checkIn: CheckIn): number {
    return checkIn.saved ? checkIn.actualAmount ?? 0 : 0;
  }
}