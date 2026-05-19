#!/usr/bin/env node

import { Command } from 'commander';
import { fetchAthletes, listAthletes } from './fetch-athletes.js';
import { fetchAllMatches, fetchMatches, cleanupMatches, listMatches } from './fetch-matches.js';

const program = new Command();

program
  .name('ophardt-crawler')
  .description('Crawl Finnish fencing data from Ophardt')
  .version('0.0.1');

const athletes = program.command('athletes').description('Manage athlete data');

athletes
  .command('fetch')
  .description('Fetch all Finnish athletes from Ophardt')
  .action(async () => {
    await fetchAthletes();
  });

athletes
  .command('list')
  .description('List cached athletes')
  .action(async () => {
    await listAthletes();
  });

const matches = program.command('matches').description('Manage match data');

matches
  .command('fetch-all')
  .description('Fetch matches for all cached athletes')
  .option('--reload', 'Re-fetch matches for athletes that already have cached data')
  .action(async (options) => {
    await fetchAllMatches({ reload: options.reload });
  });

matches
  .command('fetch')
  .description('Fetch matches for one athlete')
  .argument('<name>', 'Athlete slug or name')
  .action(async (name) => {
    await fetchMatches(name);
  });

matches
  .command('list')
  .description('List cached matches for one athlete')
  .argument('<name>', 'Athlete slug or name')
  .action(async (name) => {
    await listMatches(name);
  });

matches
  .command('cleanup')
  .description('Remove duplicate matches from cached match files')
  .action(async () => {
    await cleanupMatches();
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
