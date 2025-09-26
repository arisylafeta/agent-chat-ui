import React from 'react'

const Suggested = () => {
  return (
    <div className="pointer-events-auto w-full max-w-4xl">
      {/* Big title */}
      <h1 className="text-center font-extrabold tracking-tight text-foreground text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 sm:mb-8">
        Find your next fit in{' '}
        <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
          seconds
        </span>
        .
      </h1>
      {/* Desktop/Large: 8 cols x 2 rows (visible lg+) */}
      <div className="hidden lg:grid grid-cols-8 grid-rows-2 gap-3 sm:gap-4 h-[220px] sm:h-[260px]">
        {/* Card 1: 3 cols x 2 rows, title left, full-height image right */}
        <div className="col-span-3 row-span-2 bg-muted rounded-2xl p-4 flex items-stretch shadow-xs">
          <div className="flex-1 flex items-end">
            <h3 className="text-sm sm:text-base font-medium leading-tight">
              Make a photo look like instant film
            </h3>
          </div>
          <div className="ml-3 h-full w-1/3 overflow-hidden rounded-lg">
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800" />
          </div>
        </div>

        {/* Card 2: 2 cols x 2 rows, title above, image 80% height */}
        <div className="col-span-2 row-span-2 bg-muted rounded-2xl p-4 flex flex-col shadow-xs">
          <h3 className="text-sm sm:text-base font-medium">Create a professional headshot</h3>
          <div className="mt-3 h-[80%] w-full overflow-hidden rounded-lg">
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800" />
          </div>
        </div>

        {/* Card 3: 3 cols x 1 row, image right at 33% width */}
        <div className="col-span-3 row-span-1 bg-muted rounded-2xl p-4 flex items-stretch shadow-xs">
          <div className="flex-1 flex items-center">
            <h3 className="text-sm sm:text-base font-medium">Make my own custom mini figure</h3>
          </div>
          <div className="ml-3 h-full w-1/3 overflow-hidden rounded-lg">
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800" />
          </div>
        </div>

        {/* Card 4: 3 cols x 1 row, image right at 33% width */}
        <div className="col-span-3 row-span-1 bg-muted rounded-2xl p-4 flex items-stretch shadow-xs">
          <div className="flex-1 flex items-center">
            <h3 className="text-sm sm:text-base font-medium">Give me a 90s pixie cut</h3>
          </div>
          <div className="ml-3 h-full w-1/3 overflow-hidden rounded-lg">
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800" />
          </div>
        </div>
      </div>

      {/* Mobile/MD: 5 cols x 2 rows (no large 3x2 card), visible below lg */}
      <div className="grid grid-cols-5 grid-rows-2 gap-3 sm:gap-4 h-[200px] sm:h-[220px] lg:hidden">
        {/* Card 3: 3 cols x 1 row, image right at 33% width */}
        <div className="col-span-3 row-span-1 bg-muted rounded-2xl p-4 flex items-stretch shadow-xs">
          <div className="flex-1 flex items-center">
            <h3 className="text-sm sm:text-base font-medium">Make my own custom mini figure</h3>
          </div>
          <div className="ml-3 h-full w-1/3 overflow-hidden rounded-lg">
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800" />
          </div>
        </div>

        {/* Card 2: 2 cols x 2 rows, title above, image 80% height */}
        <div className="col-span-2 row-span-2 bg-muted rounded-2xl p-4 flex flex-col shadow-xs">
          <h3 className="text-sm sm:text-base font-medium">Create a professional headshot</h3>
          <div className="mt-3 h-[80%] w-full overflow-hidden rounded-lg">
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800" />
          </div>
        </div>

        {/* Card 4: 3 cols x 1 row, image right at 33% width */}
        <div className="col-span-3 row-span-1 bg-muted rounded-2xl p-4 flex items-stretch shadow-xs">
          <div className="flex-1 flex items-center">
            <h3 className="text-sm sm:text-base font-medium">Give me a 90s pixie cut</h3>
          </div>
          <div className="ml-3 h-full w-1/3 overflow-hidden rounded-lg">
            <div className="h-full w-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-neutral-700 dark:to-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Suggested