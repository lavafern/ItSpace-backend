CREATE OR REPLACE PROCEDURE verified_user_count(OUT user_count INT)
LANGUAGE plpgsql    
AS $$
BEGIN 
    SELECT count(*) INTO user_count FROM "User" WHERE verified = true;
END;
$$;