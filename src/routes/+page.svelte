<script lang="ts">
	import '../app.css';
	import { fetchGraphQL, GET_PUBLIC_DRIVE_TRANSACTIONS } from '$lib/graphql';
	import { onMount } from 'svelte';
	let transactions: any[] = [];
	let hasNextPage: boolean = true;
	let cursors: string[] = [];
	let currentPage: number = 0;
	let loading: boolean = false;
	let pages: number[] = [];

	async function fetchData(after: string | null) {
		loading = true;
		const { data } = await fetchGraphQL(GET_PUBLIC_DRIVE_TRANSACTIONS, { after });

		hasNextPage = data.transactions.pageInfo.hasNextPage;
		if (data.transactions.edges.length) {
			transactions = data.transactions.edges.map((edge: { node: any }) => edge.node);
			if (hasNextPage) {
				cursors[currentPage + 1] =
					data.transactions.edges[data.transactions.edges.length - 1].cursor;
			}
		}
		loading = false;
		updatePages();
	}

	function updatePages() {
		const start = Math.floor(currentPage / 10) * 10;
		pages = Array.from({ length: 10 }, (_, i) => start + i);
	}

	async function goToPage(page: number) {
		currentPage = page;
		await fetchData(cursors[page]);
	}

	onMount(async () => {
		transactions = [];
		await fetchData(null);
	});

	// PaginatorSettings
	let page = {
		offset: 0,
		limit: 5,
		size: pages.length,
		amounts: [1, 2, 5, 10]
	};
</script>

<div class="navbar bg-base-100">
	<div class="flex-1">
		<p class="btn btn-ghost normal-case text-xl">ArDrive Public Drive Explorer</p>
	</div>
	<div class="flex-none">
		<button class="btn btn-square btn-ghost">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="inline-block w-5 h-5 stroke-current"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
				/></svg
			>
		</button>
	</div>
</div>
<body>
	<main>
		<div>
			{#if loading}
				<div class="flex justify-center  ">
					<div class="card w-96 ">
						<div class="card-body flex justify-evenly">
							<p>Loading Drives...</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="container  mx-auto px-4 w-6/12">
					<ul class="list-none">
						{#each transactions as transaction}
							<li>
								<a
									rel="external"
									href={transaction.driveLink}
									target="_blank"
									class="container cursor-pointer"
								>
									<div class="stat">
										<div class="stat-value">{transaction.jsonData.name}</div>
										<div class="stat-title">By {transaction.owner.address}</div>
									</div>
								</a>
							</li>
						{/each}
					</ul>
				</div>
				<div class="btn-group  flex justify-center m-5 ">
					<button
						class="btn"
						on:click={() => goToPage(currentPage - 1)}
						disabled={currentPage === 0}
					>
						«
					</button>
					{#each pages as page}
						<button
							class:btn-active={page === currentPage}
							class="btn"
							on:click={() => goToPage(page)}
							disabled={!cursors[page] && page !== 0}
						>
							{page + 1}
						</button>
					{/each}
					<button class="btn" on:click={() => goToPage(currentPage + 1)} disabled={!hasNextPage}>
						»
					</button>
				</div>
			{/if}
		</div>
	</main>
</body>
