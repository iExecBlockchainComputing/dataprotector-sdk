import { Address, BN } from 'iexec';
import { PublishedWorkerpoolorder } from 'iexec/IExecOrderbookModule';

type VoucherInfo = {
  owner: Address;
  address: Address;
  type: BN;
  balance: BN;
  expirationTimestamp: BN;
  sponsoredApps: Address[];
  sponsoredDatasets: Address[];
  sponsoredWorkerpools: Address[];
  allowanceAmount: BN;
  authorizedAccounts: Address[];
};

function bnToNumber(bn: BN) {
  return Number(bn.toString());
}

export function checkUserVoucher({
  userVoucher,
}: {
  userVoucher: VoucherInfo;
}) {
  if (bnToNumber(userVoucher.expirationTimestamp) < Date.now() / 1000) {
    throw new Error(
      'Oops, it seems your voucher has expired. You might want to ask for a top up. Check on https://builder.iex.ec/'
    );
  }

  if (bnToNumber(userVoucher.balance) === 0) {
    throw new Error(
      'Oops, it seems your voucher is empty. You might want to ask for a top up. Check on https://builder.iex.ec/'
    );
  }
}
