import Processor from './Processing';
const proc = Processor.fromFile('/Users/taicho/Google Drive/Current Development/Git/typescript-diagrammer/test/dummytest.ts');
const str = proc.emit();
