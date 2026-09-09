import { Module } from '@nestjs/common';
import { EntryReferences } from './entry-references.js';

/** Imported by every module that records entries under a campaign. */
@Module({
  providers: [EntryReferences],
  exports: [EntryReferences],
})
export class EntriesModule {}
