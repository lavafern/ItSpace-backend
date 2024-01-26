create or replace function total_keuntungan()
	returns numeric
	 language plpgsql
  as
$$
declare 
	result1 numeric;
begin
 	SELECT SUM ("Course".price) 
	INTO result1
	FROM "Transaction"
	INNER JOIN "Course" ON "Transaction"."courseId" = "Course".id
	WHERE "Transaction"."payDone" = true;
	
	return result1;

end;
$$
