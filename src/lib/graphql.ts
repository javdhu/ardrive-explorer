import pRetry, { AbortError } from 'p-retry';

export const GET_PUBLIC_DRIVE_TRANSACTIONS = `
  query ArDrivePublicDrives($after: String) {
    transactions(
      first: 20
      after: $after
      sort: HEIGHT_DESC
      tags: [
        { name: "Drive-Privacy", values: ["public"] },
        { name: "Entity-Type", values: ["drive"] }
      ]
    ) {
      pageInfo {
        hasNextPage
      }
      edges {
        node {
          id
          owner {
            address
          }
          bundledIn {
            id
          }
          block {
            height
          }
          tags {
            name
            value
          }
        }
        cursor
      }
    }
  }
`;

export async function fetchGraphQL(query: string, variables: Record<string, any>) {
	const response = await fetch('https://www.arweave.net/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query,
			variables
		})
	});

	const result = await response.json();
	// Fetch JSON data for each transaction
	const txDataPromises = result.data.transactions.edges.map(async (edge: { node: any }) => {
		const run = async () => {
			const response = await fetch(`https://arweave.net/${edge.node.id}`);
			// Abort retrying if the resource doesn't exist
			if (response.status === 404) {
				throw new AbortError(response.statusText);
			}

			return response;
		};

		const dataResponse = await pRetry(run, { retries: 8 });
		const tags = edge.node.tags;
		const unixTime: number = tags.find((tag: { name: string }) => tag.name === 'Unix-Time')?.value;
		const driveId: string = tags.find((tag: { name: string }) => tag.name === 'Drive-Id')?.value;

		const jsonData = await dataResponse.json();
		const createdOn = new Date(unixTime).toLocaleDateString();
		const driveLink = 'https://app.ardrive.io/#/drives/' + driveId;
		return { ...edge, node: { ...edge.node, jsonData, createdOn, driveLink } };
	});

	const edgesWithData = await Promise.all(txDataPromises);

	return {
		...result,
		data: { ...result.data, transactions: { ...result.data.transactions, edges: edgesWithData } }
	};
}
