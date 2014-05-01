#!/bin/sh

USER_NUMBER=3

node processes/initialization.js

pids=""

for user_index in `seq 1 $USER_NUMBER`
do
    echo Launching user $user_index
    node load-tester.js $user_index &
    pids=$pids" "$!
done

client_number=1
for pid in $pids
do
    echo waiting for client $client_number
    wait $pid
    echo client $client_number finished
    client_number=`expr $client_number + 1`
done

node processes/merge-results.js