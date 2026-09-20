// This file defines every URL route in the application.

import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { SetupChallenge } from './components/setup-challenge/setup-challenge';
import { ChallengeDetail } from './components/challenge-detail/challenge-detail';

export const routes: Routes = [
  // This route displays the home page.
  {
    path: '',
    component: Home
  },

  // This route displays the new challenge form.
  {
    path: 'setup',
    component: SetupChallenge
  },

  // This route displays one challenge using its ID.
  {
    path: 'challenge/:id',
    component: ChallengeDetail
  },

  // This route redirects unknown URLs to the home page.
  {
    path: '**',
    redirectTo: ''
  }
];