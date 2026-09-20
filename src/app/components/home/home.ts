// This component displays the home page and the user's saved challenges.

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Savings } from '../../services/savings';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  // Router is used to move the user between pages.
  private readonly router = inject(Router);

  // Savings service provides all saved challenge data.
  private readonly savingsService = inject(Savings);

  // This signal gives the template access to all saved challenges.
  readonly challenges = this.savingsService.challenges;

  // This function opens the page for creating a new challenge.
  startNewChallenge(): void {
    this.router.navigate(['/setup']);
  }

  // This function opens the selected challenge detail page.
  openChallenge(challengeId: string): void {
    this.router.navigate(['/challenge', challengeId]);
  }
}