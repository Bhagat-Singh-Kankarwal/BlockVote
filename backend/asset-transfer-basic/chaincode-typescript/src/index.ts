import {type Contract} from 'fabric-contract-api';
import { VotingContract } from './votingContract';

export { VotingContract } from './votingContract';
export const contracts: typeof Contract[] = [VotingContract];