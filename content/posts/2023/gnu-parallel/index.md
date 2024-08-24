---
date: "2023-08-20T00:00:00Z"
description: How to use GNU Parallel to gather stats on long-running flaky tests by
  running them many times and capturing their results.
image: cover.png
title: GNU Parallel, where have you been all my life?
tags: tools
---

I was recently trying to figure out how likely a bunch of end-to-end tests were to be flaky, and wanted to gather some stats about their pass/fail rates on my local machine before including them in a broader test suite.

These tests run for a long time, as they execute extensive scenarios against a live service over HTTP. In this post I'll share the approach I ended up with using [GNU Parallel](https://www.gnu.org/software/parallel/).

---

**A quick aside**: If you wanna follow along and run the upcoming examples in your own terminal, use this command to generate some test files. They'll emulate a flaky test by sleeping between 5-15 seconds, then randomly exiting with a failure (exit code 1) or success (exit code 0):

```bash
parallel "echo 'sleep \$((\$RANDOM%10+5)) && [ \$((\$RANDOM%2)) = 1 ] \
  && printf PASS \
  || (printf FAIL && exit 1)'" \
  '>' potentially_flaky_{1}.sh ::: {1..5}
```

---

Typically to gather flakiness stats I'd use a couple of nested loops, one for each test I want to run, and another for each attempt. I like doing this kind of stuff in `bash` for its simplicity/portability:

```bash
tests=(
  potentially_flaky_1.sh
  potentially_flaky_2.sh
  potentially_flaky_3.sh
  potentially_flaky_4.sh
  potentially_flaky_5.sh
)

# For each test
for test in "${tests[@]}"; do
  # For each attempt of that test (1 through to 10)
  for attempt in $(seq 1 10); do
    # Capture timestamp for when the test started
    start=$(date "+%s")
    # Run the test and capture its exit code
    bash "$test" > /dev/null
    status=$?
    # Calculate duration of the test run
    end=$(date "+%s")
    duration=$((end - start))

    # Print results
    printf "$test attempt $attempt took ${duration}s "
    if [[ status -eq 0 ]]; then
      printf "PASS\n"
    else
      printf "FAIL\n"
    fi
  done
done
```

This approach ended up being tediously slow though... since the tests take a while to execute, running them sequentially wasn't gonna cut it.

I knew about GNU Parallel, but had never used it before. `$ man parallel` and 15 minutes later, I was "living life in the parallel lane" (as the [GNU Parallel book](https://zenodo.org/record/1146014) encourages you to do!)

Rewriting the above to work using `parallel` ended up looking like:

```bash
tests=(
  potentially_flaky_1.sh
  potentially_flaky_2.sh
  potentially_flaky_3.sh
  potentially_flaky_4.sh
  potentially_flaky_5.sh
)

parallel --progress --jobs 5 --delay 2 --timeout 3600 --shuf --results out.csv \
  bash {1} ::: ${tests[@]} ::: {1..10}
```

The joy of finding the right tool for the job can't be beat - more performance and functionality, with less code!

Let's go into a bit more detail...

## Passing inputs

In GNU Parallel, you specify a command that is to be executed in parallel. In the example provided, the command is `bash {1}`. The `{1}` is a placeholder that gets replaced with each input value (if you have more than one input you can use `{2}`, `{3}` etc).

The inputs to the command are specified after the `:::` operator. In this case, the inputs are the array of test scripts (`${tests[@]}`) and a sequence of numbers from 1 to 10 (`{1..10}`). These inputs are provided to the command in all possible combinations.

So in this case, we have 5 test scripts and we want to run each one 10 times, `parallel` will execute each command 50 times in total.

## Controlling concurrency

`parallel` provides a number of options that can be used to avoid resource contention, here are a few that I found useful for my tests:

- `--jobs 5`: Caps the number of concurrent jobs to 5 (by default `parallel` will try to execute as many jobs as you have CPU cores).
- `--delay 2`: Ensures each job waits for 2 seconds before starting, preventing a thundering herd problem.
- `--timeout 3600`: Terminates any jobs that have been running for over an hour.
- `--shuf`: Runs the jobs in a shuffled order.

## Capturing output

By default the output of your command will be printed to your terminal, however in this case since I wanted to capture stats - using `parallel`'s capability to output a CSV file instead was very helpful:

- `--results out.csv`: Outputs job completion results to the given file which includes duration, exit codes, and captured stdout/stderr.
- `--progress` prints live progress as the jobs are executing.

The CSV file ends up looking like this (only including the first lines for brevity):

```text
Seq,Host,Starttime,JobRuntime,Send,Receive,Exitval,Signal,Command,V1,V2,Stdout,Stderr
4,:,1692491267.732,6.025,0,4,1,0,"bash potentially_flaky_5.sh",potentially_flaky_5.sh,9,FAIL,
2,:,1692491263.646,12.025,0,4,0,0,"bash potentially_flaky_3.sh",potentially_flaky_3.sh,3,PASS,
1,:,1692491261.604,14.067,0,4,1,0,"bash potentially_flaky_5.sh",potentially_flaky_5.sh,2,FAIL,
5,:,1692491269.779,6.023,0,4,1,0,"bash potentially_flaky_1.sh",potentially_flaky_1.sh,3,FAIL,
3,:,1692491265.686,11.055,0,4,1,0,"bash potentially_flaky_4.sh",potentially_flaky_4.sh,8,FAIL,
```

It'd be trivial to use this output to aggregate/chart stats.

## Exploring further...

This is barely scratching the surface of what `parallel` can do. I strongly recommend the excellent, free, and funny [book by Parallel's author Ole Tange](https://zenodo.org/record/1146014). The first chapter takes 15 minutes to get through and covers 80% of what you're likely going to use.

The book covers things such as:

- Distributing jobs across different hosts using SSH, a powerful feature for leveraging multiple machines.
- Monitoring the mean time for job completion and setting timeouts for jobs based on a percentage of the mean, providing more control over long-running tasks.
- Retrying if jobs are known to be failure prone.
- Resuming jobs if parallel execution stops midway, ensuring you don't lose progress.
- Limiting amount of jobs that can run based on CPU utilization (or other signals).
- Limiting concurrency with a semaphore (and an excellent analogy about toilets).

Happy paralleling!
