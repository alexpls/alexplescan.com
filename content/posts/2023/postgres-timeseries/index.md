+++
date = '2023-07-15T00:00:00Z'
description = 'How to use set-returning functions in PostgreSQL to generate simple timeseries data.'
image = '/assets/posts/postgres-timeseries/cover.png'
title = 'Timeseries with PostgreSQL'
tags = ['postgresql']
+++

After publishing [Easy SVG Sparklines](/posts/2023/07/08/easy-svg-sparklines/) last week, I received a couple of questions about _how_ the timeseries data displayed on [Mailgrip](https://mailgrip.io/)'s charts is generated.

**tl;dr**: by querying PostgreSQL, leveraging its set returning functions, and taking a pragmatic stance on performance.

And now, for the longer answer:

Let's go with the usecase I had for Mailgrip. Generating a timeseries representing how many emails were received by an inbox over a given time period.

You could reach for a dedicated [timeseries database](https://prometheus.io/), or maybe a [PostgreSQL extension](https://www.timescale.com/) to do this, but do you really need to take on that complexity?

If you're reading this, PostgreSQL is likely where your application's data already lives, and it comes with great support for generating timeseries built-in. Let's look at how to build a query, and then how it may be used in an Elixir application.

## The timeseries query

We'll build a SQL query that'll return the number of messages received to an inbox in the past 5 days. Let's start by listing those days:

```sql
select
  cast(calendar.entry as date) as date_str
from
  generate_series(now(), now() - interval '4 day', '-1 day') as calendar (entry);
```

```text
  date_str
------------
 2023-07-15
 2023-07-14
 2023-07-13
 2023-07-12
 2023-07-11
(5 rows)
```

Few noteworthy things happening here:

- `generate_series` ([docs](https://www.postgresql.org/docs/current/functions-srf.html)) produces a set containing the days we're after. In our query this is the same as having table named `calendar` with a column named `entry`.

  It accepts `start`, `stop`, `step` as arguments. In this case I've specified: "start today", "stop 4 days ago", "1 day per step".

- `now() - interval '4 day'` utilizes PostgreSQL's [interval type](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-INTERVAL-INPUT) to subtract 4 days from today

- `cast(calendar.entry as date)` drops the time from our datetime entries, as we don't care about time precision in this case

Now that we've got the dates we're interested in, we can join them with other data from our database:

```sql
select
  cast(calendar.entry as date) as date_str,
  messages.id
from
  generate_series(now(), now() - interval '4 day', '-1 day') as calendar (entry)
  left join messages on messages.inbox_id = 1
    and cast(messages.received_at as date) = cast(calendar.entry as date);
```

```text
  date_str  |  id
------------+------
 2023-07-11 | 1200
 2023-07-11 | 1201
 2023-07-12 | 1202
 2023-07-13 | 1203
 2023-07-13 | 1204
 2023-07-14 | 1205
 2023-07-14 | 1206
 2023-07-15 |
(8 rows)
```

Using a left join to the `messages` table means that if there are any days with 0 messages received, we still include them (because "no emails received" is valid data that we want to include in our timeseries). Indeed you can see this in the example above for `2023-07-15`.

Finally, let's round this off by grouping the results and counting them:

```sql
select
  cast(calendar.entry as date) as date_str,
  count(messages.id)
from
  generate_series(now(), now() - interval '4 day', '-1 day') as calendar (entry)
  left join messages on messages.inbox_id = 1
    and cast(messages.received_at as date) = cast(calendar.entry as date)
group by calendar.entry
order by date_str asc;
```

```text
  date_str  | count
------------+-------
 2023-07-11 |     2
 2023-07-12 |     1
 2023-07-13 |     2
 2023-07-14 |     2
 2023-07-15 |     0
(5 rows)
```

Beautiful! We can see how many messages were received on each day in our series. Now if we want to generate more data, we just change the `interval '4 day'` to whatever interval we need.

## Query performance

This solution does a sequential scan of `messages` that belong to an inbox, for the period we're querying. Sequential scans are one of the first things you'd typically look at optimising, however in this particular case I haven't found it necessary.

My query window used to visualize sparklines is 30 days, for just one inbox. Even with a busy inbox that's received ~800 messages in 30 days, and running on [fly.io](https://fly.io/)'s cheapest database machine type (1 shared CPU, 256MB RAM, $1.94/mo) - this query executes in 1.13 milliseconds.

Yes, this approach would not scale for an unbounded data set, but that's something I definitely don't need to worry about now.

## Example implementation

In Elixir and using the [Ecto](https://hexdocs.pm/ecto/Ecto.html) package, the implementation looks like:

```elixir
defmodule Mailgrip.Emails do
  def message_stats(%Inbox{} = inbox, num_days) do
    sql = """
      select
        cast(calendar.entry as date) as date_str,
        count(messages.id)
      from
        generate_series(now(), now() - $2::integer * interval '1 day', '-1 day') as calendar (entry)
        left join messages on messages.inbox_id = $1::integer
          and cast(messages.received_at as date) = cast(calendar.entry as date)
      group by calendar.entry
      order by date_str asc
    """

    Repo.query!(sql, [inbox.id, Enum.max([0, num_days - 1])])
    |> Map.fetch!(:rows)
    |> Enum.map(fn [date_str, count] ->
      %{date: date_str, count: count}
    end)
  end
end
```

Combining this with the sample Elixir/Phoenix code on [Easy SVG Sparklines](/posts/2023/07/08/easy-svg-sparklines/) would give you an end to end solution.

_(For simplicity I've omitted timezone support, as well as some other business logic relevant to Mailgrip. This is still ~90% of the code I use in production to generate timeseries data)._

## Acknowledgements

[The Art of PostgreSQL](https://theartofpostgresql.com/) was a very influential book in my use of PostgreSQL (and thinking about the role of a RDBMS in general). If you like the approach layed out in this post - it's barely scratching the surface of what Dimitri Fontaine covers in the book.
