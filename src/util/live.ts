import { debug } from "./debug";

export const getLiveInputs = async () => {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const inputs: any[] = [];
  let count = -1;
  const limit = 50;

  // @TODO: This endpoint doesn't paginate? Or maybe I don't have enough
  while (count === -1 || inputs.length < count) {
    const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/live_inputs`, {
      headers: {
        'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
        // @TODO: Do some paging here if needed
      },
    });

    const theseInputs = await response.json() as any;

    // On first run, we need to set the count correctly.
    // @TODO: It should be in result_info but I don't see that in our response
    count = theseInputs.result.length;
    inputs.push(...theseInputs.result);
  }

  debug('info', `Fetched ${inputs.length} live inputs.`);

  const report = await Promise.all(inputs);

  return report;
};
