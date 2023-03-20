<script lang="ts">
	import '../app.css';
	import { fetchGraphQL, GET_PUBLIC_DRIVE_TRANSACTIONS } from '$lib/graphql';
	import { onMount } from 'svelte';
	import { AppBar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
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

<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
	<h4>ARDRIVE PUBLIC DRIVE EXPLORER</h4>

	<svelte:fragment slot="trail"><LightSwitch /></svelte:fragment>
</AppBar>
<body>
	<main>
		<div>
			{#if loading}
				<div class="placeholder" />
			{:else}
				<div class="container  mx-auto px-4 w-6/12">
					<ul class="list-none">
						{#each transactions as transaction}
							<li>
								<div class="container ">
									<header class="card-header">
										<a
											rel="external"
											href={transaction.driveLink}
											target="_blank"
											class="container cursor-pointer"
										>
											<h3 class="mt-0.5 text-lg font-medium text-gray-900 dark:text-white">
												{transaction.jsonData.name}
											</h3>
											<p>By {transaction.owner.address}</p>
										</a>
									</header>
									<section class="p-4">
										<p
											class="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3 dark:text-gray-400"
										>
											Block Height: {transaction.block.height}<br />
											Created On: {transaction.createdOn}
										</p>
									</section>
									<footer class="card-footer">
										TX: {transaction.id}
									</footer>
								</div>
								<hr class="!border-dashed" />
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="pagination flex justify-center m-4">
				<button
					class="mx-1 py-1 px-2 border border-gray-300 rounded cursor-pointer select-none disabled:opacity-50 disabled:cursor-default"
					on:click={() => goToPage(currentPage - 1)}
					disabled={currentPage === 0}
				>
					«
				</button>
				{#each pages as page}
					<button
						class:bg-red-900={page === currentPage}
						class:border-red-900={page === currentPage}
						class:text-white={page === currentPage}
						class="mx-1 py-1 px-2 border border-gray-300 cursor-pointer select-none disabled:opacity-50 disabled:cursor-default"
						on:click={() => goToPage(page)}
						disabled={!cursors[page] && page !== 0}
					>
						{page + 1}
					</button>
				{/each}
				<button
					class="mx-1 py-1 px-2 border border-gray-300  rounded cursor-pointer select-none disabled:opacity-50 disabled:cursor-default"
					on:click={() => goToPage(currentPage + 1)}
					disabled={!hasNextPage}
				>
					»
				</button>
			</div>
		</div>
	</main>
</body>
